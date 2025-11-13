import os
import subprocess
import glob
import re
import shutil

def find_image_files(directory):
    files_list = []
    for ext in ('*.png', '*.jpg', '*.jpeg'):
        files_list.extend(glob.glob(os.path.join(directory, '**', ext), recursive=True))
    return files_list

def get_next_filenumber(target_dir, prefix="image"):
    if not os.path.exists(target_dir):
        return 1
        
    existing_files = os.listdir(target_dir)
    max_num = 0
    pattern = re.compile(rf"^{re.escape(prefix)}(\d+)\.(png|jpg|jpeg)$", re.IGNORECASE)
    
    for f in existing_files:
        match = pattern.match(f)
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num
    return max_num + 1

def merge_and_rename(source_dir, target_dir, prefix):
    source_files = find_image_files(source_dir)
    if not source_files:
        return

    start_index = get_next_filenumber(target_dir, prefix)
    current_index = start_index
    os.makedirs(target_dir, exist_ok=True)

    for old_path in source_files:
        ext = os.path.splitext(old_path)[1].lower()
        if not ext: continue

        new_name = f"{prefix}{current_index}{ext}"
        new_path = os.path.join(target_dir, new_name)

        while os.path.exists(new_path):
            current_index += 1
            new_name = f"{prefix}{current_index}{ext}"
            new_path = os.path.join(target_dir, new_name)
        
        try:
            subprocess.run(["git", "mv", old_path, new_path], check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            if "not under version control" in e.stderr or "fatal:" in e.stderr:
                try:
                    os.rename(old_path, new_path)
                    subprocess.run(["git", "add", new_path], check=True)
                except OSError as oe:
                    pass
            else:
                pass
        
        current_index += 1

def merge_and_flatten_classic():
    classic_sources = find_image_files("classic")
    style_sources = find_image_files("classicStyle")
    all_sources = classic_sources + style_sources

    if not all_sources:
        return

    temp_dir = "classic_temp_folder"
    os.makedirs(temp_dir, exist_ok=True)

    current_index = 1
    for old_path