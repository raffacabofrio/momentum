import pandas as pd
import sys

def inspect_excel(file_path):
    try:
        # Carregar o Excel
        xl = pd.ExcelFile(file_path)
        print(f"Abas encontradas: {xl.sheet_names}")
        
        for sheet in xl.sheet_names:
            print(f"\n--- Aba: {sheet} ---")
            df = xl.parse(sheet)
            print(df.head(10)) # Mostra as primeiras 10 linhas
            
    except Exception as e:
        print(f"Erro ao ler o arquivo: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        inspect_excel(sys.argv[1])
    else:
        inspect_excel("SPRINTS.xlsx")
