]<]minimax[>[<tool_call>
]<]minimax[>[<invoke name="bash">]<]minimax[>[<command>ls -la; echo "---"; find . -type d -name node_modules -prune -o -type f -name "*.tsx" -print | head -50]<]minimax[>[</command>]<]minimax[>[</invoke>
]<]minimax[>[<invoke name="bash">]<]minimax[>[<command>find . -type d -name node_modules -prune -o -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.json" -o -name "*.html" \) -print | head -80]<]minimax[>[</command>]<]minimax[>[</invoke>
]<]minimax[>[</tool_call>
