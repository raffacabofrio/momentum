from fpdf import FPDF
import os

class SprintReport(FPDF):
    def header(self):
        self.set_fill_color(0, 176, 115) 
        self.rect(10, 10, 190, 2, 'F')
        
    def chapter_title(self, label):
        self.set_font('Helvetica', 'B', 16)
        self.set_text_color(0, 176, 115)
        self.cell(0, 10, label, 0, 1, 'L')
        self.ln(2)

    def sub_title(self, label):
        self.set_font('Helvetica', 'B', 12)
        self.set_text_color(50, 50, 50)
        self.cell(0, 8, label, 0, 1, 'L')
        self.ln(1)

    def body_text(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5, text)
        self.ln(4)

    def metric_table(self):
        self.set_fill_color(52, 73, 94) 
        self.set_text_color(255, 255, 255)
        self.set_font('Helvetica', 'B', 10)
        
        self.cell(40, 8, " Metrica", 1, 0, 'L', True)
        self.cell(30, 8, " Valor", 1, 0, 'L', True)
        self.cell(120, 8, " Contexto", 1, 1, 'L', True)
        
        self.set_text_color(30, 30, 30)
        self.set_font('Helvetica', '', 9)
        data = [
            ["Taxa de Entrega", "77.7%", "Manteve alta performance mesmo com fura-filas."],
            ["Pontos Entregues", "73 pts", "28 cards finalizados. Foco em estabilidade."],
            ["Escapou", "21 pts", "Volume controlado em 4 cards."],
            ["Capacity Total", "94 pts", "32 cards totais. Alta carga operacional."],
            ["Fura-filas", "13 cards", "92.3% resolvidos (12 de 13)."]
        ]
        
        for row in data:
            self.cell(40, 7, f" {row[0]}", 1, 0, 'L')
            self.cell(30, 7, f" {row[1]}", 1, 0, 'L')
            self.cell(120, 7, f" {row[2]}", 1, 1, 'L')
        self.ln(5)

pdf = SprintReport()
pdf.add_page()

pdf.set_font('Helvetica', 'B', 22)
pdf.set_text_color(0, 176, 115)
pdf.cell(0, 15, "RELATORIO EXECUTIVO - SPRINT 05", 0, 1, 'L')
pdf.set_font('Helvetica', 'B', 18)
pdf.cell(0, 10, "/ 2026", 0, 1, 'L')
pdf.ln(5)

pdf.set_font('Helvetica', '', 10)
pdf.set_text_color(0, 0, 0)
pdf.cell(0, 5, "Periodo: 09/03 a 23/03", 0, 1)
pdf.cell(0, 5, "Objetivos: Zerar problemas com OMS e manter estabilidade.", 0, 1)
pdf.cell(0, 5, "SWAT: Charliston (CHA)", 0, 1)
pdf.set_font('Helvetica', 'B', 10)
pdf.cell(28, 5, "Contexto Critico:", 0, 0)
pdf.set_font('Helvetica', '', 10)
pdf.multi_cell(0, 5, " Sprint marcada por resiliencia. O time absorveu o maior volume de fura-filas do ano (13 cards). Bloqueios de infraestrutura e instabilidades externas foram os principais desafios.")
pdf.ln(5)

pdf.chapter_title("Metricais Principais")
pdf.metric_table()

pdf.chapter_title("Analise: Maturidade contra Instabilidades")
pdf.sub_title("O 'Pedagio' da Infraestrutura")
pdf.body_text("Nesta sprint, o verdadeiro atraso veio de dentro: instabilidade de Cashback/BFF e bloqueios na maquina de testes do Carrefour. O time operou como um escudo contra fura-filas.")

pdf.chapter_title("Performance Individual")
pdf.sub_title("Destaques")
pdf.body_text("- Parceria Backend (VAL & WAN): Sinergia total. Entregas limpas que dispensaram re-teste.\n- Gustavo (Dev Junior): Escudo operacional. Puxou cards de menor complexidade para liberar o time.\n- Charliston (Senior/SWAT): Integracao do Teste A/B Nativo VTEX na Master.")

pdf.chapter_title("Analise de Fura-filas")
pdf.body_text("- Volume: 13 cards (Recorde em 2026).\n- Resolvidos: 92.3% (12 entregues).\n- Trend: Alta perigosa no volume, exigindo revisao de refino para a SP06.")

pdf.chapter_title("Recomendacoes")
pdf.body_text("1. Blindagem do QA: Resolver equipamento do Cleison com Nata.\n2. Mock de Cashback: Adotar versao isolada para testes unitarios.\n3. Refino Tactico: Fernando deve revisar cards simples para evitar surpresas.\n4. Alinhamento Cloud Build: Sessao rapida para destravar acessos do Backend.")

output_dir = "src/reports"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

file_name = os.path.join(output_dir, "RELATORIO-SP05.pdf")
pdf.output(file_name)
print(f"PDF Gerado com sucesso: {file_name}")
