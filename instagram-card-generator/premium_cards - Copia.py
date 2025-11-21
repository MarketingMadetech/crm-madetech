"""
🎨 GERADOR PREMIUM DE CARDS MADETECH
Design espetacular e sofisticado com múltiplas camadas visuais
"""

import google.generativeai as genai
from PIL import Image, ImageDraw, ImageFont
import os
from dotenv import load_dotenv
import time
import json
import random
import math

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

# Paleta Premium Madetech
CORES = {
    "azul_claro": (0, 102, 204),        # #0066cc
    "azul_medio": (0, 51, 153),         # #003399
    "azul_escuro": (0, 30, 90),         # #001e5a
    "ouro": (255, 215, 0),              # #FFD700
    "ouro_claro": (255, 235, 100),      # #FFEB64
    "branco": (255, 255, 255),
    "cinza_claro": (240, 240, 240),
    "cinza_medio": (150, 150, 150),
    "cinza_escuro": (50, 50, 50),
}

class MadetechPremiumCardGenerator:
    def __init__(self):
        self.width = 1080
        self.height = 1920
        self.output_dir = "output"
        os.makedirs(self.output_dir, exist_ok=True)
        
    def gerar_conteudo_ia(self, tema: str) -> dict:
        """Gera conteúdo otimizado para cards premium"""
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        prompt = f"""
        Você é designer especialista em marketing B2B para máquinas industriais.
        
        Crie conteúdo IMPACTANTE para um card Instagram premium sobre: {tema}
        
        Retorne EXATAMENTE em JSON (sem markdown):
        {{
            "titulo": "título curto e poderoso (max 20 chars)",
            "subtitulo": "descrição atraente (max 40 chars)",
            "destaque": "uma palavra-chave (max 15 chars)",
            "beneficio": "benefício principal (max 30 chars)",
            "cta": "chamada para ação (max 20 chars)"
        }}
        
        Seja OUSADO e IMPACTANTE!
        """
        
        try:
            response = model.generate_content(prompt)
            texto = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(texto)
        except:
            return {
                "titulo": tema[:18],
                "subtitulo": "Tecnologia Madetech",
                "destaque": "INOVAÇÃO",
                "beneficio": "Máxima Produtividade",
                "cta": "Saiba Mais"
            }
    
    def criar_fundo_gradiente_premium(self) -> Image.Image:
        """Cria fundo com gradiente sofisticado"""
        img = Image.new('RGB', (self.width, self.height), CORES["cinza_escuro"])
        draw = ImageDraw.Draw(img)
        
        # Gradiente vertical complexo
        for y in range(self.height):
            # Efeito de transição não-linear
            progress = y / self.height
            progress_curved = math.sin(progress * math.pi) * 0.5 + 0.5
            
            r = int(CORES["azul_claro"][0] * (1 - progress) + CORES["azul_escuro"][0] * progress)
            g = int(CORES["azul_claro"][1] * (1 - progress) + CORES["azul_escuro"][1] * progress)
            b = int(CORES["azul_claro"][2] * (1 - progress) + CORES["azul_escuro"][2] * progress)
            
            draw.line([(0, y), (self.width, y)], fill=(r, g, b))
        
        return img
    
    def adicionar_fundo_geometrico(self, img: Image.Image) -> Image.Image:
        """Adiciona formas geométricas elegantes"""
        draw = ImageDraw.Draw(img, 'RGBA')
        
        # Círculos grandes translúcidos
        tamanhos = [800, 600, 400]
        posicoes = [
            (self.width - 400, -200),
            (-300, self.height - 300),
            (self.width // 2, self.height + 100),
        ]
        cores = [
            (255, 215, 0, 15),      # Ouro muito translúcido
            (255, 235, 100, 10),    # Ouro claro muito translúcido
            (255, 255, 255, 8),     # Branco muito translúcido
        ]
        
        for i, (tamanho, pos, cor) in enumerate(zip(tamanhos, posicoes, cores)):
            x, y = pos
            draw.ellipse([(x, y), (x + tamanho, y + tamanho)], fill=cor)
        
        # Linhas decorativas
        draw.rectangle([(0, 300), (self.width, 310)], fill=(255, 215, 0, 20))
        draw.rectangle([(0, self.height - 400), (self.width, self.height - 390)], fill=(255, 215, 0, 20))
        
        return img
    
    def adicionar_badge_premium(self, img: Image.Image, destaque: str) -> Image.Image:
        """Adiciona badge premium no topo"""
        draw = ImageDraw.Draw(img, 'RGBA')
        
        try:
            font_badge = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 28)
            font_icon = ImageFont.truetype("C:\\Windows\\Fonts\\Arial.ttf", 40)
        except:
            font_badge = ImageFont.load_default()
            font_icon = ImageFont.load_default()
        
        # Container do badge
        badge_x, badge_y = 40, 80
        badge_w, badge_h = 300, 70
        
        # Fundo do badge com borda
        draw.rectangle(
            [(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)],
            fill=(255, 215, 0, 30),
            outline=(255, 215, 0, 100),
            width=3
        )
        
        # Ícone
        draw.text((badge_x + 15, badge_y + 15), "⭐", font=font_icon, fill=CORES["ouro"])
        
        # Texto
        draw.text(
            (badge_x + 70, badge_y + 20),
            destaque.upper(),
            font=font_badge,
            fill=CORES["ouro"]
        )
        
        return img
    
    def adicionar_conteudo_principal(self, img: Image.Image, titulo: str, subtitulo: str, beneficio: str, cta: str) -> Image.Image:
        """Adiciona conteúdo principal com layout profissional"""
        draw = ImageDraw.Draw(img)
        
        try:
            font_titulo = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 90)
            font_subtitulo = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 48)
            font_beneficio = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 40)
            font_cta = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 36)
        except:
            font_titulo = ImageFont.load_default()
            font_subtitulo = ImageFont.load_default()
            font_beneficio = ImageFont.load_default()
            font_cta = ImageFont.load_default()
        
        # Posições
        titulo_y = 450
        subtitulo_y = 600
        beneficio_y = 800
        cta_y = 1500
        
        # Sombra + Texto (Título)
        for offset in range(3):
            draw.text(
                (50 + offset, titulo_y + offset),
                titulo.upper(),
                font=font_titulo,
                fill=(0, 0, 0)
            )
        draw.text(
            (50, titulo_y),
            titulo.upper(),
            font=font_titulo,
            fill=CORES["branco"]
        )
        
        # Linha decorativa após título
        draw.rectangle(
            [(50, titulo_y + 110), (400, titulo_y + 118)],
            fill=CORES["ouro"]
        )
        
        # Subtítulo
        for offset in range(2):
            draw.text(
                (50 + offset, subtitulo_y + offset),
                subtitulo,
                font=font_subtitulo,
                fill=(0, 0, 0)
            )
        draw.text(
            (50, subtitulo_y),
            subtitulo,
            font=font_subtitulo,
            fill=(220, 220, 220)
        )
        
        # Benefício com destaque
        draw.rectangle(
            [(40, beneficio_y - 10), (1040, beneficio_y + 80)],
            fill=(255, 215, 0, 20),
            outline=(255, 215, 0, 50),
            width=2
        )
        draw.text(
            (80, beneficio_y + 10),
            f"✨ {beneficio}",
            font=font_beneficio,
            fill=CORES["ouro"]
        )
        
        return img
    
    def adicionar_cta_premium(self, img: Image.Image, cta: str) -> Image.Image:
        """Adiciona CTA premium no rodapé"""
        draw = ImageDraw.Draw(img)
        
        try:
            font_cta = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 40)
        except:
            font_cta = ImageFont.load_default()
        
        cta_y = 1700
        cta_x = 50
        
        # Botão CTA
        botao_w, botao_h = 980, 100
        draw.rectangle(
            [(cta_x, cta_y), (cta_x + botao_w, cta_y + botao_h)],
            fill=CORES["ouro"],
            outline=CORES["ouro_claro"],
            width=3
        )
        
        # Texto do botão
        draw.text(
            (cta_x + 100, cta_y + 25),
            f"🚀 {cta.upper()}",
            font=font_cta,
            fill=CORES["azul_escuro"]
        )
        
        # Linha final
        draw.rectangle(
            [(40, self.height - 80), (self.width - 40, self.height - 70)],
            fill=CORES["ouro"]
        )
        
        return img
    
    def gerar_card_premium(self, tema: str) -> str:
        """Gera um card premium com design espetacular"""
        print(f"\n🎨 Gerando card PREMIUM: {tema}")
        
        # 1. Conteúdo
        print("📝 Gerando conteúdo impactante...")
        conteudo = self.gerar_conteudo_ia(tema)
        
        # 2. Fundo
        print("🎨 Criando design profissional...")
        img = self.criar_fundo_gradiente_premium()
        img = self.adicionar_fundo_geometrico(img)
        
        # 3. Badge
        img = self.adicionar_badge_premium(img, conteudo.get('destaque', 'PREMIUM'))
        
        # 4. Conteúdo
        img = self.adicionar_conteudo_principal(
            img,
            conteudo.get('titulo', tema),
            conteudo.get('subtitulo', 'Premium'),
            conteudo.get('beneficio', 'Qualidade Máxima'),
            conteudo.get('cta', 'Conheça Agora')
        )
        
        # 5. CTA
        img = self.adicionar_cta_premium(img, conteudo.get('cta', 'Conheça Agora'))
        
        # 6. Salvar
        nome = f"premium_{tema.replace(' ', '_').lower()}_{int(time.time())}.png"
        caminho = os.path.join(self.output_dir, nome)
        img.save(caminho, quality=95)
        
        print(f"✅ Card PREMIUM salvo: {caminho}")
        return caminho

# Teste
if __name__ == "__main__":
    gerador = MadetechPremiumCardGenerator()
    
    temas = [
        "Corte de Precisão",
        "Colagem Profissional",
        "Usinagem CNC",
    ]
    
    print("\n" + "="*60)
    print("🌟 GERANDO CARDS PREMIUM MADETECH")
    print("="*60)
    
    for tema in temas:
        gerador.gerar_card_premium(tema)
        time.sleep(1)
    
    print("\n✨ Cards PREMIUM gerados com sucesso!")
