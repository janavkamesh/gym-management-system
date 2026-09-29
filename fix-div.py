import re

with open('components/ActivityLogsClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("          </p>\n        </div>\n        \n        <button", "          </p>\n          </div>\n        </div>\n        \n        <button")

with open('components/ActivityLogsClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
