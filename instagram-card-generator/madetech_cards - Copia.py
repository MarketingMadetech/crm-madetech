"""
Gerador de Cards Instagram com Identidade Visual MADETECH
Usa cores, fonts e estilo do site da Madetech
"""

import google.generativeai as genai
from PIL import Image, ImageDraw, ImageFont
import os
from dotenv import load_dotenv
import time
import json
import random

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

# Cores Madetech
CORES_MADETECH = {
    "azul_primaria": "#0066cc",      # Azul principal do site
    "azul_escuro": "#003d99",        # Azul escuro para gradiente
    "branco": "#ffffff",              # Branco
    "cinza_claro": "#f0f0f0",        # Cinza claro
    "ouro": "#FFD700",                # Ouro para destaque
    "texto_principal": "#333333",     # Cinza escuro
}

class MadetechCardGenerator:
    def __init__(self):
        self.width = 1080
        self.height = 1920
        self.output_dir = "output"
        os.makedirs(self.output_dir, exist_ok=True)
        self.cores = CORES_MADETECH
        
    def gerar_conteudo_ia(self, tema: str, categoria: str = "Geral") -> dict:
        """Gera conteúdo usando IA adaptado para Madetech"""
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        prompt = f"""
        Você é um especialista em marketing para a MADETECH, empresa que vende máquinas para marcenaria.
        
        Crie um conteúdo para um card de Instagram (1080x1920) sobre: {tema}
        Categoria: {categoria}
        
        Retorne EXATAMENTE neste formato JSON (sem markdown):
        {{
            "titulo": "título curto e impactante (max 30 chars)",
            "subtitulo": "subtítulo/call-to-action (max 50 chars)",
            "palavra_chave": "uma palavra-chave da Madetech",
            "estilo": "profissional"
        }}
        
        IMPORTANTE:
        - Foque em benefícios (produtividade, precisão, rentabilidade)
        - Use linguagem B2B (dirigida a marceneiros/empresários)
        - Seja claro e direto
        - Inclua urgência quando possível
        """
        
        try:
            response = model.generate_content(prompt)
            texto = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(texto)
        except Exception as e:
            print(f"⚠️  Usando valores padrão")
            return {
                "titulo": tema[:28],
                "subtitulo": "Tecnologia Madetech",
                "palavra_chave": "Inovação",
                "estilo": "profissional"
            }
    
    def hex_para_rgb(self, hex_cor: str) -> tuple:
        """Converte cor hexadecimal para RGB"""
        hex_cor = hex_cor.lstrip('#')
        return tuple(int(hex_cor[i:i+2], 16) for i in (0, 2, 4))
    
    def criar_gradiente_madetech(self) -> Image.Image:
        """Cria um fundo com gradiente da cor Madetech"""
        img = Image.new('RGB', (self.width, self.height))
        draw = ImageDraw.Draw(img)
        
        cor1_rgb = self.hex_para_rgb(self.cores["azul_primaria"])
        cor2_rgb = self.hex_para_rgb(self.cores["azul_escuro"])
        
        # Gradiente vertical de azul claro para azul escuro
        for y in range(self.height):
            r = int(cor1_rgb[0] + (cor2_rgb[0] - cor1_rgb[0]) * (y / self.height))
            g = int(cor1_rgb[1] + (cor2_rgb[1] - cor1_rgb[1]) * (y / self.height))
            b = int(cor1_rgb[2] + (cor2_rgb[2] - cor1_rgb[2]) * (y / self.height))
            draw.line([(0, y), (self.width, y)], fill=(r, g, b))
        
        # Adiciona círculos decorativos (inspirado no site)
        ouro_rgb = self.hex_para_rgb(self.cores["ouro"])
        for i in range(5):
            x = random.randint(-200, self.width + 200)
            y = random.randint(-200, self.height + 200)
            size = random.randint(200, 600)
            
            # Círculos com transparência
            draw.ellipse(
                [(x, y), (x + size, y + size)],
                fill=(*ouro_rgb, 30) if len(ouro_rgb) > 2 else (*ouro_rgb, 30)
            )
        
        return img
    
    def adicionar_elemento_marca(self, draw, y_pos: int):
        """Adiciona elementos visuais da marca (barra, ícone, etc)"""
        # Barra dourada no topo do card
        draw.rectangle(
            [(40, y_pos), (100, y_pos + 6)],
            fill=self.hex_para_rgb(self.cores["ouro"])
        )
    
    def adicionar_texto_profissional(self, img: Image.Image, titulo: str, subtitulo: str, palavra_chave: str = None) -> Image.Image:
        """Adiciona texto com estilo profissional Madetech"""
        draw = ImageDraw.Draw(img)
        
        # Fontes
        try:
            font_titulo = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 72)
            font_subtitulo = ImageFont.truetype("C:\\Windows\\Fonts\\Arial.ttf", 42)
            font_badge = ImageFont.truetype("C:\\Windows\\Fonts\\Arial.ttf", 32)
        except:
            font_titulo = ImageFont.load_default()
            font_subtitulo = ImageFont.load_default()
            font_badge = ImageFont.load_default()
        
        branco = self.hex_para_rgb(self.cores["branco"])
        ouro = self.hex_para_rgb(self.cores["ouro"])
        
        # Badge no topo com palavra-chave
        if palavra_chave:
            badge_y = 150
            self.adicionar_elemento_marca(draw, badge_y)
            
            badge_text = f"⭐ {palavra_chave.upper()}"
            draw.text((130, badge_y - 5), badge_text, font=font_badge, fill=ouro)
        
        # Posição do título e subtítulo
        titulo_y = self.height // 2 - 250
        subtitulo_y = self.height // 2 + 80
        
        # Limita tamanho
        if len(titulo) > 32:
            titulo = titulo[:29] + "..."
        if len(subtitulo) > 52:
            subtitulo = subtitulo[:49] + "..."
        
        # Efeito de sombra (3 camadas)
        sombra_cor = (0, 0, 0)
        for offset in range(1, 4):
            draw.text(
                (50 + offset, titulo_y + offset),
                titulo,
                font=font_titulo,
                fill=sombra_cor
            )
            draw.text(
                (50 + offset, subtitulo_y + offset),
                subtitulo,
                font=font_subtitulo,
                fill=sombra_cor
            )
        
        # Texto principal (branco)
        draw.text((50, titulo_y), titulo, font=font_titulo, fill=branco)
        draw.text((50, subtitulo_y), subtitulo, font=font_subtitulo, fill=branco)
        
        # CTA no rodapé
        cta_y = self.height - 200
        cta_text = "🚀 Conheça Nossas Soluções"
        draw.text((50, cta_y), cta_text, font=font_subtitulo, fill=ouro)
        
        # Linha decorativa no final
        draw.rectangle(
            [(40, self.height - 60), (self.width - 40, self.height - 55)],
            fill=ouro
        )
        
        return img
    
    def gerar_card_madetech(self, tema: str, categoria: str = "Geral", nome_arquivo: str = None) -> str:
        """Gera um card com identidade Madetech"""
        print(f"\n🚀 Gerando card Madetech: {tema}")
        
        # 1. Gera conteúdo com IA
        print("📝 Gerando conteúdo com IA (adaptado para Madetech)...")
        conteudo = self.gerar_conteudo_ia(tema, categoria)
        
        # 2. Cria fundo com gradiente Madetech
        print("🎨 Aplicando identidade visual Madetech...")
        img = self.criar_gradiente_madetech()
        
        # 3. Adiciona texto profissional
        print("✍️  Adicionando conteúdo...")
        img = self.adicionar_texto_profissional(
            img,
            conteudo.get('titulo', tema),
            conteudo.get('subtitulo', 'Tecnologia Madetech'),
            conteudo.get('palavra_chave', 'Inovação')
        )
        
        # 4. Salva
        if not nome_arquivo:
            nome_arquivo = f"madetech_{tema.replace(' ', '_').lower()}_{int(time.time())}.png"
        
        caminho = os.path.join(self.output_dir, nome_arquivo)
        img.save(caminho)
        
        print(f"✅ Card Madetech salvo em: {caminho}")
        return caminho


# Teste
if __name__ == "__main__":
    gerador = MadetechCardGenerator()
    
    # Temas alinhados com Madetech
    temas = [
        ("Corte com Precisão", "Corte"),
        ("Colagem Automática", "Colagem"),
        ("Usinagem CNC", "Usinagem"),
    ]
    
    for tema, categoria in temas:
        gerador.gerar_card_madetech(tema, categoria)
        time.sleep(1)
    
    print("\n✨ Cards Madetech gerados com sucesso!")
