from pathlib import Path
p = Path('src/routes/cozinha.tsx')
s = p.read_text()
alvo = '''          ingredientes={ingredientes as any[]}
          preparacoes={preparacoes as any[]}
          itensPreparacao={itensPrep}
          custoIng={custoIng}'''
novo = '''          ingredientes={ingredientes as any[]}
          preparacoes={preparacoes as any[]}
          embalagens={embalagens as any[]}
          itensPreparacao={itensPrep}
          custoIng={custoIng}'''
if alvo not in s:
    raise SystemExit('bloco ReceitaModal nao encontrado')
s = s.replace(alvo, novo, 1)
p.write_text(s)
