import re

with open('components/ActivityLogsClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(r"No activity found{period === 'Overall' ? '' : period === 'Custom' ? ' in this period' : \ in \}", "No activity found{period === 'Overall' ? '' : period === 'Custom' ? ' in this period' :  in }")

with open('components/ActivityLogsClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
