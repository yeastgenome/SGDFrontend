pantherGeneFile = 'data/pantherGeneList021119.txt'

#read the file
with open(pantherGeneFile,'r') as file:
    lines = file.readlines()
    for line in lines:
        words = line.split()
        print(words[1],words[-1])

#read the database.


#compare the database for insert or update or delete


#init
# if __name__ == '__main__':
#     update_data()
