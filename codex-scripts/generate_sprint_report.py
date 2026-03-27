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
            ["Taxa de Entrega", "81.2%", "Boa consistencia mesmo com demandas nao planejadas."],
            ["Pontos Entregues", "68 pts", "26 cards finalizados com foco em estabilidade."],
            ["Escapou", "16 pts", "Volume moderado em 3 cards."],
            ["Capacity Total", "84 pts", "30 cards totais no recorte da sprint."],
            ["Fura-filas", "7 cards", "85.7% resolvidos (6 de 7)."]
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
pdf.cell(0, 5, "Objetivos: estabilizar integracoes criticas e reduzir retrabalho.", 0, 1)
pdf.cell(0, 5, "SWAT: Alex (ALX)", 0, 1)
pdf.set_font('Helvetica', 'B', 10)
pdf.cell(28, 5, "Contexto Critico:", 0, 0)
pdf.set_font('Helvetica', '', 10)
pdf.multi_cell(0, 5, " Sprint marcada por resiliencia. O time absorveu alta pressao operacional, com demandas urgentes e alguns bloqueios de ambiente ao longo do ciclo.")
pdf.ln(5)

pdf.chapter_title("Metricais Principais")
pdf.metric_table()

pdf.chapter_title("Analise: Maturidade contra Instabilidades")
pdf.sub_title("O custo da instabilidade de ambiente")
pdf.body_text("Nesta sprint, parte relevante do atraso veio de dependencias tecnicas e indisponibilidades de ambiente. Ainda assim, o time sustentou a operacao e protegeu a capacidade de entrega.")

pdf.chapter_title("Performance Individual")
pdf.sub_title("Destaques")
pdf.body_text("- Parceria Backend (ALX & BIA): Boa sinergia e entregas consistentes.\n- Leo (Dev Mid): Assumiu demandas operacionais para preservar foco do restante do time.\n- Alex (Senior/SWAT): Liderou a estabilizacao das integracoes mais sensiveis.")

pdf.chapter_title("Analise de Fura-filas")
pdf.body_text("- Volume: 7 cards no periodo.\n- Resolvidos: 85.7% (6 entregues).\n- Tendencia: demanda urgente ainda acima do ideal, exigindo melhor blindagem no proximo ciclo.")

pdf.chapter_title("Recomendacoes")
pdf.body_text("1. Blindagem de QA: estabilizar ambiente de testes antes da proxima sprint.\n2. Mock de integracao: adotar isolamento para reduzir dependencia externa em validacoes.\n3. Refino tatico: revisar melhor cards pequenos para evitar surpresa de escopo.\n4. Alinhamento de acessos: remover gargalos tecnicos do backend logo no inicio do ciclo.")

output_dir = "src/reports"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

file_name = os.path.join(output_dir, "RELATORIO-SP05.pdf")
pdf.output(file_name)
print(f"PDF Gerado com sucesso: {file_name}")
