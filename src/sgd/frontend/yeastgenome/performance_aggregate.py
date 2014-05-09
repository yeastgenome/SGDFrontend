__author__ = 'kpaskov'

from os import listdir
from datetime import datetime
from math import floor

method_to_times = {}
file_to_times = {}
root_file = '/Users/kpaskov/sgd-ng2_log/backend'
file_names = [x for x in listdir(root_file) if not x.startswith('.')]
for file_name in file_names:
    print file_name
    f = open(root_file + '/'+ file_name, 'r')
    file_to_times[file_name] = []
    key_to_pieces = {}
    problem_lines = []
    for line in f:
        pieces = line.strip().split(' ')
        date = pieces[0]
        time = pieces[1]
        project = pieces[2]
        key = pieces[3]
        if pieces[4] == 'end':
            start = key_to_pieces[key][1]
            start_time = datetime.strptime(start, "%H:%M:%S,%f")
            end_time = datetime.strptime(time, "%H:%M:%S,%f")
            total_time = (end_time-start_time).total_seconds()
            method = key_to_pieces[key][4]
            if method in method_to_times:
                method_to_times[method].append(total_time)
            else:
                method_to_times[method] = [total_time]
            if method != 'home' and method != 'all_bibentries':
                if method != key_to_pieces[key][4]:
                    print method + '\t' + key_to_pieces[key]
                file_to_times[file_name].append(total_time)
                if total_time > 1:
                    problem_lines.append(str(total_time) + '\t' + str(key_to_pieces[key]))
        elif len(pieces) >= 5:
            method = pieces[4]
            argument = None if len(pieces) == 5 else pieces[5]
            key_to_pieces[key] = pieces
        else:
            print pieces
    f.close()

print 'Overall Times\tMin\t1st Quartile\tMedian\t3rd Quartile\tMax\tVolume'
for key, values in method_to_times.iteritems():
    values.sort()
    length = len(values)
    min_val = str(values[0])
    max_val = str(values[-1])
    quart1 = str(values[int(floor(0.25*length))])
    median = str(values[int(floor(0.5*length))])
    quart3 = str(values[int(floor(0.75*length))])
    print '\t'.join([key, min_val, quart1, median, quart3, max_val, str(length), ])

print 'By Day Times\tMin\t1st Quartile\tMedian\t3rd Quartile\tMax\tVolume'
for filename in file_names:
    values = file_to_times[filename]
    values.sort()
    length = len(values)
    min_val = str(values[0])
    max_val = str(values[-1])
    quart1 = str(values[int(floor(0.25*length))])
    median = str(values[int(floor(0.5*length))])
    quart3 = str(values[int(floor(0.75*length))])
    print '\t'.join([filename, min_val, quart1, median, quart3, max_val, str(length)])

print 'Problem Areas'
for problem_line in problem_lines:
    print problem_line
