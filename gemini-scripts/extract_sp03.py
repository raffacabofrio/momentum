import pandas as pd
import re
import json

def extract_sp03_data(file_path):
    try:
        df = pd.read_excel(file_path, sheet_name='2026 - SP 03', header=None)
        
        data = {
            "realized": [],
            "escaped": [],
            "comments": {}
        }
        
        for index, row in df.iterrows():
            # C1: Realizado, C2: Escapou
            for col, category in [(1, "realized"), (2, "escaped")]:
                cell_content = str(row.iloc[col]) if pd.notna(row.iloc[col]) else ""
                lines = cell_content.split('\n')
                
                current_ticket = None
                for line in lines:
                    line = line.strip()
                    if not line: continue
                    
                    ticket_match = re.search(r'(DEAT-\d+)', line)
                    if ticket_match:
                        tid = ticket_match.group(1)
                        data[category].append(tid)
                        current_ticket = tid
                    elif current_ticket and line.startswith('-'):
                        comment = line.lstrip('-').strip()
                        if current_ticket in data["comments"]:
                            data["comments"][current_ticket] += f" | {comment}"
                        else:
                            data["comments"][current_ticket] = comment
        
        print(json.dumps(data, indent=2, ensure_ascii=False))
                
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    extract_sp03_data("SPRINTS.xlsx")
