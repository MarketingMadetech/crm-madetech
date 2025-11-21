"""
Script para gerar vários cards automaticamente em lote
"""
from image_generator import InstagramCardGenerator
import time

def main():
    print("\n" + "="*60)
    print("📊 GERADOR EM LOTE - CARDS INSTAGRAM")
    print("="*60)
    
    gerador = InstagramCardGenerator()
    
    # Temas predefinidos para teste
    temas = [
        "Marketing Digital",
        "E-commerce",
        "Social Media",
        "Consultoria Empresarial",
        "Transformação Digital",
    ]
    
    print(f"\n🚀 Gerando {len(temas)} cards automaticamente...\n")
    
    for i, tema in enumerate(temas, 1):
        try:
            print(f"[{i}/{len(temas)}] ", end="")
            gerador.gerar_card_completo(tema)
            time.sleep(1)  # Pausa para não sobrecarregar a API
        except Exception as e:
            print(f"❌ Erro ao gerar '{tema}': {e}")
    
    print("\n" + "="*60)
    print("✅ Todos os cards foram gerados com sucesso!")
    print("📁 Verifique a pasta 'output' para ver os cards")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
