import sys, os
path = sys.argv[1]
content = sys.stdin.read()
os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
with open(path, 'w', encoding='utf-8') as out:
    out.write(content)
print('Successfully wrote', path)
