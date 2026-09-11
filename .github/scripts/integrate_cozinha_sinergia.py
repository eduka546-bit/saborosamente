from pathlib import Path

path = Path('src/routes/cozinha.tsx')
s = path.read_text(encoding='utf-8')

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
