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

class InstagramCardGenerator:
    def __init__(self):
        self.width = 1080
        self.height = 1920
        self.output_dir = "output"
        os.makedirs(self.output_dir, exist_ok=True)
        
    def gerar_conteudo_ia(self, tema: str) -> dict:
        """Gera conteúdo usando IA do Google"""
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        prompt = f"""
        Crie um conteúdo para um card do Instagram Story sobre: {tema}
        
        Retorne EXATAMENTE neste formato JSON (sem markdown):
        {{
            "titulo": "título principal curto",
            "subtitulo": "subtítulo/descrição",
            "cor_primaria": "#FF6B6B",
            "cor_secundaria": "#4ECDC4"
        }}
        """
        
        try:
            response = model.generate_content(prompt)
            # Remove marcas de markdown se houver
            texto = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(texto)
        except Exception as e:
            print(f"⚠️  Usando valores padrão: {e}")
            return {
                "titulo": tema[:30].upper(),
                "subtitulo": "Conteúdo Marketing",
                "cor_primaria": "#FF6B6B",
                "cor_secundaria": "#4ECDC4"
            }
    
    def hex_para_rgb(self, hex_cor: str) -> tuple:
        """Converte cor hexadecimal para RGB"""
        hex_cor = hex_cor.lstrip('#')
        return tuple(int(hex_cor[i:i+2], 16) for i in (0, 2, 4))
    
    def gerar_imagem_com_ia(self, tema: str, cor_primaria: str, cor_secundaria: str) -> Image.Image:
        """Gera imagem com design visual moderno"""
        print(f"🎨 Criando design visual...")
        
        try:
            # Converte cores hexadecimais para RGB
            cor1 = self.hex_para_rgb(cor_primaria)
            cor2 = self.hex_para_rgb(cor_secundaria)
            
            # Cria imagem com gradiente
            img = Image.new('RGB', (self.width, self.height), color=cor1)
            draw = ImageDraw.Draw(img, 'RGBA')
            
            # Adiciona gradiente vertical
            for y in range(self.height):
                r = int(cor1[0] + (cor2[0] - cor1[0]) * (y / self.height))
                g = int(cor1[1] + (cor2[1] - cor1[1]) * (y / self.height))
                b = int(cor1[2] + (cor2[2] - cor1[2]) * (y / self.height))
                draw.line([(0, y), (self.width, y)], fill=(r, g, b))
            
            # Adiciona elementos visuais decorativos
            for i in range(8):
                x = random.randint(0, self.width)
                y = random.randint(0, self.height)
                size = random.randint(150, 400)
                opacidade = random.randint(20, 60)
                
                cor_elemento = (
                    random.randint(200, 255),
                    random.randint(150, 220),
                    random.randint(100, 200),
                    opacidade
                )
                
                draw.ellipse(
                    [(x, y), (x + size, y + size)],
                    fill=cor_elemento
                )
            
            return img
            
        except Exception as e:
            print(f"⚠️  Usando fundo padrão: {e}")
            return self._criar_fundo_padrao()
    
    def _criar_fundo_padrao(self) -> Image.Image:
        """Cria um fundo padrão moderno"""
        img = Image.new('RGB', (self.width, self.height), color='#1a1a2e')
        draw = ImageDraw.Draw(img)
        
        # Gradiente do topo para baixo (azul para roxo)
        for y in range(self.height):
            r = int(26 + (100 - 26) * (y / self.height))
            g = int(26 + (100 - 26) * (y / self.height))
            b = int(46 + (200 - 46) * (y / self.height))
            draw.line([(0, y), (self.width, y)], fill=(r, g, b))
        
        return img
    
    def adicionar_texto_card(self, img: Image.Image, titulo: str, subtitulo: str) -> Image.Image:
        """Adiciona texto ao card com efeito profissional"""
        draw = ImageDraw.Draw(img)
        
        # Tenta usar fontes do sistema Windows
        try:
            font_titulo = ImageFont.truetype("C:\\Windows\\Fonts\\Arial.ttf", 70)
            font_subtitulo = ImageFont.truetype("C:\\Windows\\Fonts\\Arial.ttf", 40)
        except:
            try:
                font_titulo = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 70)
                font_subtitulo = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 40)
            except:
                font_titulo = ImageFont.load_default()
                font_subtitulo = ImageFont.load_default()
        
        # Posiciona texto no centro
        titulo_y = self.height // 2 - 250
        subtitulo_y = self.height // 2 + 50
        
        # Limita tamanho do texto
        if len(titulo) > 30:
            titulo = titulo[:27] + "..."
        if len(subtitulo) > 50:
            subtitulo = subtitulo[:47] + "..."
        
        # Desenha sombra (efeito de profundidade)
        for offset in range(1, 4):
            draw.text(
                (50 + offset, titulo_y + offset),
                titulo,
                font=font_titulo,
                fill=(0, 0, 0, 100)
            )
            draw.text(
                (50 + offset, subtitulo_y + offset),
                subtitulo,
                font=font_subtitulo,
                fill=(0, 0, 0, 80)
            )
        
        # Desenha texto principal em branco
        draw.text((50, titulo_y), titulo, font=font_titulo, fill=(255, 255, 255))
        draw.text((50, subtitulo_y), subtitulo, font=font_subtitulo, fill=(220, 220, 220))
        
        # Adiciona barra decorativa
        draw.rectangle(
            [(40, titulo_y - 20), (80, titulo_y - 15)],
            fill=(255, 200, 100)
        )
        
        return img
    
    def gerar_card_completo(self, tema: str, nome_arquivo: str = None) -> str:
        """Gera um card completo com IA + design visual"""
        print(f"\n🚀 Gerando card para: {tema}")
        
        # 1. Gera conteúdo com IA
        print("📝 Gerando conteúdo com IA...")
        conteudo = self.gerar_conteudo_ia(tema)
        
        titulo = conteudo.get('titulo', tema)
        subtitulo = conteudo.get('subtitulo', 'Marketing Digital')
        cor_primaria = conteudo.get('cor_primaria', '#FF6B6B')
        cor_secundaria = conteudo.get('cor_secundaria', '#4ECDC4')
        
        # 2. Gera imagem visual
        img = self.gerar_imagem_com_ia(tema, cor_primaria, cor_secundaria)
        
        # 3. Adiciona texto
        print("✍️  Adicionando texto...")
        img = self.adicionar_texto_card(img, titulo, subtitulo)
        
        # 4. Salva arquivo
        if not nome_arquivo:
            nome_arquivo = f"{tema.replace(' ', '_').lower()}_{int(time.time())}.png"
        
        caminho = os.path.join(self.output_dir, nome_arquivo)
        img.save(caminho)
        
        print(f"✅ Card salvo em: {caminho}")
        return caminho
