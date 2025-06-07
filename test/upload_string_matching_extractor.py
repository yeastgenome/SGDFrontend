import logging

import dill

from agr_entity_extractor.models import AllianceStringMatchingEntityExtractorConfig, \
    AllianceStringMatchingEntityExtractor, CustomTokenizer
from utils.abc_utils import upload_ml_model, download_abc_model, get_all_curated_entities

logger = logging.getLogger(__name__)


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Upload the entity extractor model to the Alliance ML API")
    parser.add_argument("-m", "--mod-abbreviation", required=True,
                        help="The MOD abbreviation (e.g., FB, WB, SGD, etc.)")
    parser.add_argument("-s", "--species", required=True,
                        help="The taxon id of the species related to the entity extraction model")
    parser.add_argument("--min-matches", type=int, required=True, help="Minimum number of matches required for an "
                                                                       "entity to be extracted")
    parser.add_argument("--tfidf-threshold", type=float, required=True, help="TF-IDF threshold for entity extraction")
    parser.add_argument("-t", "--topic", required=True, help="The topic of the model")
    parser.add_argument("--log-level", default="INFO",
                        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"])
    parser.add_argument("--match-uppercase", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        stream=None)

    tfidf_vectorizer_model_file_path = (f"/data/agr_entity_extraction/tfidf_vectorization_"
                                        f"{args.mod_abbreviation}_{args.topic.replace(':', '_')}.dpkl")
    download_abc_model(mod_abbreviation=args.mod_abbreviation, topic=args.topic,
                       output_path=tfidf_vectorizer_model_file_path, task_type="tfidf_vectorization")

    tfidf_vectorizer = dill.load(open(tfidf_vectorizer_model_file_path, "rb"))

    entity_extraction_model_file_path = (f"/data/agr_entity_extraction/biocuration_entity_extraction_"
                                         f"{args.mod_abbreviation}_{args.topic.replace(':', '_')}.dpkl")

    def load_entities_dynamically_fnc():
        return get_all_curated_entities(
            mod_abbreviation=args.mod_abbreviation,
            entity_type_str=(
                "gene" if args.topic == "ATP:0000005"
                else "allele" if args.topic == "ATP:0000006"
                else "strain" if args.topic == "ATP:0000027"
                else "gene"
            )
        )

    entities_to_extract, name_to_curie_mapping = load_entities_dynamically_fnc()
    custom_tokenizer = CustomTokenizer(tokens=entities_to_extract, match_uppercase_entities=args.match_uppercase)
    upper_to_original_mapping = {entity.upper(): entity for entity in entities_to_extract}

    # Initialize the model
    config = AllianceStringMatchingEntityExtractorConfig()
    model = AllianceStringMatchingEntityExtractor(
        config=config,
        min_matches=args.min_matches,
        tfidf_threshold=args.tfidf_threshold,
        tokenizer=custom_tokenizer,
        vectorizer=tfidf_vectorizer,
        entities_to_extract=entities_to_extract,
        load_entities_dynamically_fnc=load_entities_dynamically_fnc,
        match_uppercase=args.match_uppercase,
        name_to_curie_mapping=name_to_curie_mapping,
        upper_to_original_mapping=upper_to_original_mapping
    )

    # Serialize the model
    with open(entity_extraction_model_file_path, "wb") as file:
        dill.dump(model, file, recurse=True)

    stats = {
        "model_name": "Alliance String Matching Entity Extractor",
        "average_precision": None,
        "average_recall": None,
        "average_f1": None,
        "best_params": None,
    }
    upload_ml_model(task_type="biocuration_entity_extraction", mod_abbreviation=args.mod_abbreviation,
                    model_path=entity_extraction_model_file_path, stats=stats, topic=args.topic, file_extension="dpkl",
                    species=args.species)
    logger.info(f"String Matching Entity Extractor uploaded to the Alliance API for {args.mod_abbreviation}.")


if __name__ == "__main__":
    main()
