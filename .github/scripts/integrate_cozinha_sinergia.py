from pathlib import Path
import re

path = Path('src/routes/cozinha.tsx')
s = path.read_text(encoding='utf-8')

# One-time cleanup for the ficha modal: keep exactly one Preparações block.
pattern = r'\n    \{abaFicha==="preparacoes" && <section>.*?</section>\}'
blocks = re.findall(pattern, s, re.S)
if len(blocks) > 1:
    s = re.sub(pattern, lambda m: blocks[0], s, flags=re.S)

import_line = 'import { supabase } from "@/integrations/supabase/client";'
new_import = import_line + '\nimport { SugestoesProducaoSinergia } from "@/components/cozinha/SugestoesProducaoSinergia";'
if 'SugestoesProducaoSinergia' not in s:
    if import_line not in s:
        raise SystemExit('import anchor not found')
    s = s.replace(import_line, new_import, 1)

anchor = '''              <div className="mb-5 grid gap-3 sm:grid-cols-3">'''
jsx = '''              <SugestoesProducaoSinergia
                dataProducao={dataProducao}
                producoes={producoes as any[]}
                produtos={produtos as any[]}
                receitas={receitas as any[]}
                receitaItens={receitaItens as any[]}
                ingredientes={ingredientes as any[]}
                estoqueMarmitas={estoqueMarmitas as any[]}
              />
'''
if '<SugestoesProducaoSinergia' not in s:
    if anchor not in s:
        raise SystemExit('JSX anchor not found')
    s = s.replace(anchor, jsx + anchor, 1)

path.write_text(s, encoding='utf-8')
