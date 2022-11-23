import csv
max_lines = 1000
with open('transactions.csv', "r") as f:
    header = f.readline()
    print(header)
    i = 0
    j = 0
    lines = []
    for line in f:
        lines.append(line)
        j += 1
        if j >= max_lines:
            with open(f'chunk{i}.csv', "w") as chunk:
                print(len(lines))
                chunk.writelines([header] + lines)
            i += 1
            lines = []
            j = 0
            if i >= 10:
                break
