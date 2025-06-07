import argparse
import logging
import os
import shutil
import time
import dill
import numpy as np

from sklearn.feature_extraction.text import HashingVectorizer, TfidfTransformer
from sklearn.pipeline import make_pipeline
from sklearn.utils import murmurhash3_32
from joblib import Parallel, delayed
from scipy.sparse import diags

from agr_entity_extractor.models import CustomTokenizer
from utils.abc_utils import (
    get_all_ref_curies,
    download_tei_files_for_references,
    get_all_curated_entities,
    upload_ml_model
)
from utils.tei_utils import convert_all_tei_files_in_dir_to_txt

logger = logging.getLogger(__name__)


def fit_vectorizer_on_agr_corpus(
    mod_abbreviation: str = None,
    topic: str = None,
    match_uppercase: bool = False,
    wipe_download_dir: bool = False,
    continue_download: bool = False
):
    logger.info("== fit_vectorizer_on_agr_corpus START ==")
    logger.info(
        f"Configuration: mod={mod_abbreviation}, topic={topic}, uppercase={match_uppercase}, "
        f"wipe={wipe_download_dir}, continue_download={continue_download}"
    )

    download_dir = os.getenv("AGR_CORPUS_DOWNLOAD_DIR", "/tmp/alliance_corpus")
    logger.info(f"Using download directory: {download_dir}")

    """
    # Optional wipe of existing corpus
    if wipe_download_dir and not continue_download:
        logger.info(f"Wiping download directory: {download_dir}")
        if os.path.exists(download_dir):
            shutil.rmtree(download_dir)
        os.makedirs(download_dir, exist_ok=True)
        logger.info("Wipe complete.")

    # Check for existing TEI/TXT
    tei_present = False
    txt_present = False
    if not continue_download and os.path.exists(download_dir):
        files = os.listdir(download_dir)
        tei_present = any(f.endswith('.tei') for f in files)
        txt_present = any(f.endswith('.txt') for f in files)
        logger.info(f"Found TEI: {tei_present}, TXT: {txt_present}")

    # Download TEIs if needed
    if not tei_present and not txt_present:
        logger.info("Downloading TEI files...")
        ref_curies = get_all_ref_curies(mod_abbreviation=mod_abbreviation)
        logger.info(f"References to download: {len(ref_curies)}")
        if continue_download:
            present = {f.replace('_', ':')[:-4] for f in files if f.endswith('.tei')}
            ref_curies = [r for r in ref_curies if r not in present]
            logger.info(f"Skipping already present TEIs, remaining: {len(ref_curies)}")
        download_tei_files_for_references(ref_curies, download_dir, mod_abbreviation)
        logger.info("TEI download complete.")
        tei_present = True

    # Convert TEI to TXT
    if tei_present and not txt_present:
        logger.info("Converting TEI to TXT...")
        convert_all_tei_files_in_dir_to_txt(download_dir)
        logger.info("Conversion complete.")
    """
    
    # Fetch curated entities
    logger.info("Fetching curated entities...")
    entity_type = (
        "gene" if topic == "ATP:0000005"
        else "allele" if topic == "ATP:0000006"
        else "strain" if topic == "ATP:0000027"
        else "gene"
    )
    curated_entities, _ = get_all_curated_entities(
        mod_abbreviation=mod_abbreviation,
        entity_type_str=entity_type
    )
    logger.info(f"Fetched {len(curated_entities)} {entity_type} entities.")

    # Initialize tokenizer
    logger.info("Initializing CustomTokenizer...")
    custom_tokenizer = CustomTokenizer(
        tokens=curated_entities,
        match_uppercase_entities=match_uppercase
    )

    # Gather and preload text contents
    text_files = [
        os.path.join(download_dir, f)
        for f in os.listdir(download_dir)
        if f.endswith('.txt')
    ]
    logger.info(f"Found {len(text_files)} TXT files for TF-IDF fitting.")
    if not text_files:
        logger.error("No TXT files found; aborting TF-IDF fit.")
        raise FileNotFoundError(f"No .txt files in {download_dir}")

    logger.info("Preloading all text files into memory...")
    text_contents = []
    for idx, path in enumerate(text_files, start=1):
        with open(path, 'r') as f:
            text_contents.append(f.read())
        if idx % 1000 == 0:
            logger.info(f"Preloaded {idx}/{len(text_files)} files into memory")

    # Set up streaming HashingVectorizer + TF-IDF transformer
    n_features = 2**20
    hasher = HashingVectorizer(
        input='content',
        tokenizer=lambda txt: custom_tokenizer.tokenize(txt),
        n_features=n_features,
        alternate_sign=False,
        norm=None
    )

    # Parallel document-frequency counting
    logger.info("Counting document frequencies in parallel chunks...")
    total_docs = len(text_contents)
    chunk_size = 1000
    chunks = [text_contents[i:i+chunk_size] for i in range(0, total_docs, chunk_size)]
    logger.info(f"Total chunks: {len(chunks)}, using {os.cpu_count()} cores")

    def count_df_chunk(chunk):
        X = hasher.transform(chunk)
        _, feats = X.nonzero()
        return np.bincount(feats, minlength=n_features)

    # use joblib verbose mode for live progress
    dfs = Parallel(n_jobs=-1, batch_size=1, verbose=10)(
        delayed(count_df_chunk)(chunk) for chunk in chunks
    )
    df = np.sum(dfs, axis=0)
    logger.info("Completed DF counting across all documents.")

    # Compute IDF vector
    idf = np.log((total_docs + 1) / (df + 1)) + 1.0
    tfidf_tf = TfidfTransformer(norm=None, use_idf=True)
    tfidf_tf.idf_ = idf
    try:
        tfidf_tf._idf_diag = diags(idf)
    except Exception:
        logger.warning("Could not build sparse diagonal, proceeding without _idf_diag")
        tfidf_tf._idf_diag = None

    # Build pipeline and inject vocabulary map
    tfidf_vectorizer = make_pipeline(hasher, tfidf_tf)
    vocab_map = {}
    for ent in curated_entities:
        h = murmurhash3_32(ent, positive=True) % n_features
        vocab_map[ent] = h
        if match_uppercase:
            vocab_map[ent.upper()] = h
    tfidf_vectorizer.vocabulary_ = vocab_map
    tfidf_vectorizer.idf_ = idf
    logger.info("Streaming TF-IDF pipeline ready. Features: %d", n_features)

    logger.info("== fit_vectorizer_on_agr_corpus END ==")
    return tfidf_vectorizer


def save_vectorizer_to_file(vectorizer, output_path="tfidf_vectorizer.pkl"):
    logger.info("Saving vectorizer to %s", output_path)
    with open(output_path, "wb") as f:
        dill.dump(vectorizer, f)
    logger.info("Saved vectorizer.")


def load_vectorizer_from_file(input_path="tfidf_vectorizer.pkl"):
    logger.info("Loading vectorizer from %s", input_path)
    with open(input_path, "rb") as f:
        vect = dill.load(f)
    logger.info("Loaded vectorizer.")
    return vect


def main():
    parser = argparse.ArgumentParser(description="Fit & save a TF-IDF vectorizer")
    parser.add_argument('-m', '--mod-abbreviation', required=True)
    parser.add_argument('-t', '--topic', required=True)
    parser.add_argument('-o', '--output-path', default='tfidf_vectorizer.pkl')
    parser.add_argument('--match-uppercase', action='store_true')
    parser.add_argument('--wipe-download-dir', action='store_true')
    parser.add_argument('-c', '--continue-download', action='store_true')
    parser.add_argument('--log-level', default='INFO', choices=['DEBUG','INFO','WARNING','ERROR','CRITICAL'])
    parser.add_argument('--update-custom-tokenizer', action='store_true')
    parser.add_argument('-u', '--upload-to-alliance', action='store_true')
    args = parser.parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level.upper(), logging.INFO),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    if not os.path.exists(args.output_path):
        vect = fit_vectorizer_on_agr_corpus(
            mod_abbreviation=args.mod_abbreviation,
            topic=args.topic,
            match_uppercase=args.match_uppercase,
            wipe_download_dir=args.wipe_download_dir,
            continue_download=args.continue_download
        )
        save_vectorizer_to_file(vect, args.output_path)
    else:
        vect = load_vectorizer_from_file(args.output_path)

    if args.update_custom_tokenizer:
        curated_entities, _ = get_all_curated_entities(
            mod_abbreviation=args.mod_abbreviation,
            entity_type_str='gene'
        )
        custom_tokenizer = CustomTokenizer(tokens=curated_entities)
        vect.tokenizer = lambda doc: custom_tokenizer.tokenize(doc)
        save_vectorizer_to_file(vect, args.output_path)
        logger.info("Custom tokenizer updated.")

    if args.upload_to_alliance:
        stats = {
            "model_name": "TFIDF vectorizer",
            "average_precision": None,
            "average_recall": None,
            "average_f1": None,
            "best_params": None,
        }
        upload_ml_model(
            task_type='tfidf_vectorization',
            mod_abbreviation=args.mod_abbreviation,
            topic=args.topic,
            model_path=args.output_path,
            stats=stats,
            dataset_id=None,
            file_extension='dpkl'
        )
        logger.info(f"Uploaded vectorizer for {args.mod_abbreviation}, topic {args.topic}.")


if __name__ == '__main__':
    main()
