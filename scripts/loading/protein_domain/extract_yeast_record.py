from datetime import datetime
import sys

__author__ = 'sweng66'

match_file = "data/match_complete.xml"
out_file = "data/match_yeast.xml"

def extract_domains():
     
    f = open(match_file)
    
    is_yeast_record = 0
    for line in f:
        line = line.strip()
        # <protein id="A0A023PXN9" name="YI171_YEAST" length="150" crc64="758F5E7B8903AEF7"></protein>
        if "<protein id=" in line and "_YEAST" in line:
            is_yeast_record = 1
            print(line)
        elif "</protein>" in line:
            is_yeast_record = 0
        elif is_yeast_record == 1:
            print(line)
            
    f.close()


if __name__ == '__main__':

    print(datetime.now())

    extract_domains()

    print(datetime.now())

