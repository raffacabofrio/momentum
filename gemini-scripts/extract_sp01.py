import pandas as pd

def get_sp01_data(file_path):
    try:
        df = pd.read_excel(file_path, sheet_name='2026 - SP 01', skiprows=2)
        # O DataFrame parece ter 3 colunas baseadas no inspect anterior: 
        # 0: Épico/Contexto, 1: Realizado, 2: Escapou
        
        print("--- DADOS DA PLANILHA (SP01 2026) ---")
        for index, row in df.iterrows():
            epic = str(row.iloc[0]).split('\n')[0] if pd.notna(row.iloc[0]) else "N/A"
            realized = str(row.iloc[1]) if pd.notna(row.iloc[1]) else ""
            escaped = str(row.iloc[2]) if pd.notna(row.iloc[2]) else ""
            
            if realized or escaped:
                print(f"Épico: {epic}")
                if realized: print(f"  [REALIZADO] {realized}")
                if escaped:  print(f"  [ESCAPOU]   {escaped}")
                print("-" * 30)
                
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    get_sp01_data("SPRINTS.xlsx")
