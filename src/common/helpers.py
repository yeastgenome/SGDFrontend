import hashlib
import werkzeug
import os
import shutil

def md5(fname):
    hash = hashlib.md5()
    with open(fname, "rb") as f:
        for chunk in iter(lambda: f.read(4096), ""):
            hash.update(chunk)
    return hash.hexdigest()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[-1] in ['txt', 'jpg', 'json']

def secure_save_file(file, filename):
    filename = werkzeug.secure_filename(filename)
    temp_file_path = os.path.join('/tmp', filename)

    file.seek(0)
    with open(temp_file_path, 'wb') as output_file:
	shutil.copyfileobj(file, output_file)

    return temp_file_path
