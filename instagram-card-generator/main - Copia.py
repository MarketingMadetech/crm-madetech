import google.generativeai as genai
from PIL import Image, ImageDraw, ImageFont
import os
import textwrap
from datetime import datetime
from dotenv import load_dotenv
from config import CARD_WIDTH, CARD_HEIGHT, COLORS, FONTS, THEMES

# Carregar variáveis de ambiente
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("⚠️ GOOGLE_API_KEY não encontrada no arquivo .env")

# Configurar API
genai.configure(api_key=api_key)


class InstagramCardGenerator:
    def __init__(self, theme="dark"):
        self.theme = THEMES.get(theme, THEMES["dark"])
        self.model = genai.GenerativeModel("gemini-2.0-flash")
        
    def generate_content(self, prompt):
        """Gera conteúdo usando Google AI"""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"❌ Erro ao gerar conteúdo: {e}")
            return None
    
    def create_card(self, title, subtitle="", background_color=None):
        """Cria um card 1080x1920"""
        
        # Usar cor do tema se não especificar
        if background_color is None:
            background_color = self.theme['background']
        
        # Criar imagem
        img = Image.new('RGB', (CARD_WIDTH, CARD_HEIGHT), background_color)
        draw = ImageDraw.Draw(img)
        
        # Tentar carregar fonte (fallback para padrão se não encontrar)
        try:
            title_font = ImageFont.truetype("arial.ttf", FONTS['title'])
            subtitle_font = ImageFont.truetype("arial.ttf", FONTS['subtitle'])
        except:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        # Cores do tema
        primary_text = self.theme['primary_text']
        secondary_text = self.theme['secondary_text']
        
        # Posições
        title_y = CARD_HEIGHT // 3
        subtitle_y = CARD_HEIGHT // 2
        
        # Desenhar título (centralizado com wrap)
        title_lines = textwrap.wrap(title, width=15)
        y_offset = title_y
        for line in title_lines:
            bbox = draw.textbbox((0, 0), line, font=title_font)
            text_width = bbox[2] - bbox[0]
            x = (CARD_WIDTH - text_width) // 2
            draw.text((x, y_offset), line, fill=primary_text, font=title_font)
            y_offset += FONTS['title'] + 20
        
        # Desenhar subtitle
        if subtitle:
            subtitle_lines = textwrap.wrap(subtitle, width=20)
            y_offset = subtitle_y
            for line in subtitle_lines:
                bbox = draw.textbbox((0, 0), line, font=subtitle_font)
                text_width = bbox[2] - bbox[0]
                x = (CARD_WIDTH - text_width) // 2
                draw.text((x, y_offset), line, fill=secondary_text, font=subtitle_font)
                y_offset += FONTS['subtitle'] + 15
        
        return img
    
    def save_card(self, img, filename="card.png"):
        """Salva o card como imagem"""
        output_dir = "output"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        filepath = os.path.join(output_dir, filename)
        img.save(filepath)
        print(f"✅ Card salvo em: {filepath}")
        return filepath


def main():
    """Função principal para teste"""
    
    print("=" * 50)
    print("🎨 Instagram Card Generator")
    print("=" * 50)
    
    # Inicializar gerador
    generator = InstagramCardGenerator(theme="dark")
    
    # Teste 1: Card com texto simples
    print("\n📝 Teste 1: Criando card com texto simples...")
    img1 = generator.create_card(
        title="Marketing Digital",
        subtitle="Estratégias que funcionam"
    )
    generator.save_card(img1, f"card_1_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
    
    # Teste 2: Usando AI para gerar conteúdo
    print("\n🤖 Teste 2: Gerando conteúdo com Google AI...")
    prompt = "Crie um título curto e impactante para um card de Instagram sobre marketing digital. Responda apenas com o título."
    content = generator.generate_content(prompt)
    
    if content:
        print(f"Conteúdo gerado: {content}")
        img2 = generator.create_card(
            title=content.strip(),
            subtitle="Descubra as melhores estratégias"
        )
        generator.save_card(img2, f"card_2_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
    
    # Teste 3: Card com tema light
    print("\n🌅 Teste 3: Card com tema light...")
    generator_light = InstagramCardGenerator(theme="light")
    img3 = generator_light.create_card(
        title="Transforme seu Negócio",
        subtitle="Com as melhores soluções"
    )
    generator_light.save_card(img3, f"card_3_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
    
    print("\n✨ Testes concluídos!")
    print("📁 Verifique a pasta 'output' para ver os cards gerados")


if __name__ == "__main__":
    main()
