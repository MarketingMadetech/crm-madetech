# Script para gerar múltiplos cards de uma vez

from main import InstagramCardGenerator
from datetime import datetime

def generate_multiple_cards():
    """Gera vários cards com prompts diferentes"""
    
    generator = InstagramCardGenerator(theme="dark")
    
    prompts = [
        {
            "theme": "Marketing",
            "title_prompt": "Crie um título curto e impactante para um card sobre Marketing Digital",
            "subtitle": "Estratégias que funcionam"
        },
        {
            "theme": "Vendas",
            "title_prompt": "Escreva um título motivacional sobre vendas B2B",
            "subtitle": "Aumente suas conversões"
        },
        {
            "theme": "Consultoria",
            "title_prompt": "Crie um título profissional para um card sobre consultoria empresarial",
            "subtitle": "Transforme seu negócio"
        },
    ]
    
    for i, item in enumerate(prompts, 1):
        print(f"\n🎯 Gerando card {i}/{len(prompts)}: {item['theme']}")
        
        # Gerar conteúdo com AI
        content = generator.generate_content(item['title_prompt'])
        
        if content:
            title = content.strip().split('\n')[0][:50]  # Pegar primeira linha, max 50 chars
            
            # Criar e salvar card
            img = generator.create_card(
                title=title,
                subtitle=item['subtitle']
            )
            generator.save_card(
                img, 
                f"card_{item['theme'].lower()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            )

if __name__ == "__main__":
    print("=" * 50)
    print("📊 Gerador de Múltiplos Cards")
    print("=" * 50)
    generate_multiple_cards()
    print("\n✨ Todos os cards foram gerados!")
