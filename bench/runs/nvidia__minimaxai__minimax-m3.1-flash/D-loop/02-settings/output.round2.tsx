]<]minimax[>[<tool_call>
{"name": "ash", "parameters": {"command": "ls -la && echo '---' && ls -la src 2>/dev/null && echo '---' && find . -path ./node_modules -prune -o -name '*.tsx' -print 2>/dev/null | head -50"}}
{"name": "ash", "parameters": {"command": "find . -path ./node_modules -prune -o -type d -name 'components' -print 2>/dev/null | head -20"}}
