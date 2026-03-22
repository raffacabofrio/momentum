import pandas as pd
import re
import json

def extract_ninja_sp01(file_path):
    try:
        df = pd.read_excel(file_path, sheet_name='2026 - SP 01', header=None)
        
        comments_map = {}
        
        # Iterar por todas as células
        for index, row in df.iterrows():
            for col in range(len(df.columns)):
                cell_content = str(row.iloc[col]) if pd.notna(row.iloc[col]) else ""
                
                # Explodir o conteúdo da célula por linhas
                lines = cell_content.split('\n')
                
                current_ticket = None
                for line in lines:
                    line = line.strip()
                    if not line: continue
                    
                    # Procura por ticket DEAT-XXXXX
                    ticket_match = re.search(r'(DEAT-\d+)', line)
                    
                    if ticket_match:
                        current_ticket = ticket_match.group(1)
                    elif current_ticket and line.startswith('-'):
                        # Se a linha começa com '-', é a justificativa do ticket anterior
                        justification = line.lstrip('-').strip()
                        if current_ticket in comments_map:
                            comments_map[current_ticket] += f" | {justification}"
                        else:
                            comments_map[current_ticket] = justification
        
        print(json.dumps(comments_map, indent=2, ensure_ascii=False))
                
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    extract_ninja_sp01("SPRINTS.xlsx")
