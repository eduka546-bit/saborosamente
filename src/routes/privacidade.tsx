import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { clearGoogleAnalyticsConsent } from "@/lib/google-analytics";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade | SaborosaMente" },
      {
        name: "description",
        content: "Política de privacidade e tratamento de dados da SaborosaMente.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  const dataAtualizacao = "10 de outubro de 2026";

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-[#086e45] mb-2">Política de Privacidade</h1>
      <p className="text-base text-gray-600 mb-10">Última atualização: {dataAtualizacao}</p>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-8">
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">1. Sobre a SaborosaMente</h2>
          <p>
            A <strong>SaborosaMente</strong> é uma empresa especializada em marmitas congeladas
            artesanais, com sede em São Bento do Sul/SC. Fornecemos refeições práticas, saudáveis e
            saborosas para delivery e retirada na loja.
          </p>
          <p className="mt-2">
            Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e
            protegemos suas informações pessoais ao utilizar nosso site (
            <strong>www.saborosamente.com</strong>), nosso atendimento via WhatsApp e demais
            serviços.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">2. Dados que coletamos</h2>
          <p>Coletamos as seguintes categorias de dados:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Dados de identificação:</strong> nome completo, CPF (para cadastro).
            </li>
            <li>
              <strong>Dados de contato:</strong> e-mail, número de telefone/WhatsApp.
            </li>
            <li>
              <strong>Dados de entrega:</strong> endereço completo, cidade, bairro, CEP.
            </li>
            <li>
              <strong>Dados de pedidos:</strong> itens comprados, valores, forma de pagamento,
              histórico de compras.
            </li>
            <li>
              <strong>Dados de navegação:</strong> páginas acessadas, eventos de navegação,
              dispositivo e navegador. O Google Analytics e o Microsoft Clarity só são carregados
              quando você autoriza as métricas opcionais.
            </li>
            <li>
              <strong>Dados de comunicação:</strong> mensagens trocadas via WhatsApp, incluindo
              conversas com nosso assistente virtual (Saborosa).
            </li>
            <li>
              <strong>Dados de cashback:</strong> saldo acumulado e histórico de transações de
              cashback.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">3. Como utilizamos seus dados</h2>
          <p>Seus dados são utilizados para:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Processar e entregar seus pedidos.</li>
            <li>Comunicar o status do pedido via WhatsApp e e-mail.</li>
            <li>Gerenciar seu cadastro, login e histórico de compras.</li>
            <li>Calcular e creditar cashback nas suas compras.</li>
            <li>Prestar atendimento ao cliente, inclusive via assistente virtual (IA).</li>
            <li>Enviar ofertas e promoções (somente com seu consentimento).</li>
            <li>
              Recuperar carrinhos abandonados por WhatsApp somente quando houver
              autorização específica para esse contato, como a opção do checkout.
            </li>
            <li>Cumprir obrigações legais e fiscais.</li>
            <li>Melhorar nossos produtos, serviços e experiência de compra.</li>
          </ul>
        </section>

        <section id="regulamento-sorteio">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Condições de participação — sorteio mensal SaborosaMente</h2>
          <p>
            Campanha destinada a novos visitantes maiores de 18 anos, sem conta nem compras
            anteriores associadas ao telefone informado. A inscrição é gratuita e não exige compra.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Para participar, informe nome completo e WhatsApp com DDD no formulário.</li>
            <li>Cada telefone pode ser inscrito uma única vez, sem participações adicionais para cadastros duplicados.</li>
            <li>O cadastro é permanente: há até 12 edições anuais, uma por mês. Quem for contemplado em um ano fica inelegível nas demais edições desse mesmo ano e volta automaticamente a participar a partir de janeiro do ano seguinte.</li>
            <li>O prêmio anunciado é uma semana de marmitas da SaborosaMente. Quantidades, tamanhos, sabores, modalidades de entrega ou retirada e datas de apuração devem ser apresentados nas regras específicas de cada edição.</li>
            <li>O participante contemplado não participa novamente no mesmo ano civil, mas pode voltar a ganhar em anos seguintes.</li>
            <li>A SaborosaMente poderá conferir elegibilidade, inconsistências e duplicidades.</li>
          </ul>
          <p className="mt-3">
            <strong>Finalidade dos dados do sorteio:</strong> nome, WhatsApp e identificador
            de sessão são utilizados para registrar a participação, verificar critérios,
            evitar duplicidade e entrar em contato sobre a campanha e eventual premiação.
            Informações de carrinho só podem ser associadas para fins de atendimento e
            funcionamento da loja; o envio de lembretes promocionais depende de autorização
            específica. O cadastro no sorteio não autoriza automaticamente outros usos comerciais.
          </p>
          <p className="mt-2">
            <strong>Proteção das informações:</strong> não vendemos, alugamos nem cedemos
            cadastros de participantes, dados de pedidos, conversas ou informações de
            navegação para campanhas independentes de terceiros. Somente fornecedores
            envolvidos na operação dos serviços poderão processar os dados necessários
            à sua finalidade, conforme detalhado nesta política; isso não significa que
            nenhum prestador externo tenha acesso técnico aos dados.
          </p>
          <p className="mt-2">
            <strong>Consentimento para o sorteio:</strong> ao marcar “Aceito os termos do sorteio
            conforme regulamento”, o participante concorda com estas condições e com o
            tratamento de nome, telefone e identificador de sessão para administrar a inscrição,
            verificar elegibilidade e entrar em contato sobre a campanha e eventual premiação.
            Participar não cria automaticamente uma conta, não exige compras e não autoriza
            por si só anúncios, ofertas ou mensagens de recuperação de carrinho.
          </p>
          <p className="mt-2">
            <strong>Google Analytics 4 e Microsoft Clarity:</strong> são ferramentas opcionais
            para medir visitas, interações, comportamento de navegação e melhorar a experiência
            no site. O Clarity pode gerar mapas de calor e gravações com campos sensíveis
            mascarados. Só são carregados após o visitante aceitar métricas no aviso
            específico de cookies, independentemente da participação no sorteio.
            Recusar ou revogar métricas não impede a inscrição.
          </p>
          <p className="mt-2">
            <strong>Promoções por WhatsApp:</strong> ofertas, novidades e campanhas comerciais
            exigem autorização própria. O aceite do sorteio não ativa a opção de marketing,
            não substitui uma recusa anterior nem permite envio automático de promoções.
            Mensagens necessárias ao andamento do sorteio ou à entrega do prêmio são distintas
            das mensagens comerciais.
          </p>
          <p className="mt-2">
            <strong>Recuperação de carrinhos por WhatsApp:</strong> lembretes sobre pedidos não
            finalizados dependem de autorização específica, como a opção disponível no checkout.
            O cadastro no sorteio não a concede. O usuário pode desmarcar essa opção no
            checkout e solicitar a interrupção das mensagens respondendo
            <strong> PARAR</strong> ou pelos canais de contato indicados abaixo.
          </p>
          <p className="mt-2">
            As autorizações opcionais podem ser recusadas ou revogadas sem cancelar a inscrição
            no sorteio. Prestadores de tecnologia envolvidos nas respectivas finalidades
            poderão tratar dados conforme esta Política de Privacidade.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            4. Assistente virtual (WhatsApp IA)
          </h2>
          <p>
            Nosso atendimento via WhatsApp utiliza inteligência artificial (Saborosa) para responder
            dúvidas, apresentar o cardápio e registrar pedidos. As conversas são armazenadas em
            nossa base de dados para fins de atendimento, treinamento e melhoria do serviço.
          </p>
          <p className="mt-2">
            A qualquer momento você pode solicitar a exclusão do seu histórico de conversa entrando
            em contato pelo WhatsApp <strong>+55 47 99160-7757</strong> ou pelo e-mail de contato da
            empresa.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">5. Compartilhamento de dados</h2>
          <p>
            <strong>Seus dados não são vendidos, alugados ou cedidos a terceiros para
            comercializar listas de clientes, fazer propaganda própria ou explorar
            comercialmente informações da SaborosaMente.</strong> Não divulgamos
            cadastros, telefones, histórico de pedidos ou conversas a empresas externas
            para campanhas independentes.
          </p>
          <p className="mt-2">
            Para operar a loja e prestar os serviços solicitados, alguns dados estritamente
            necessários podem ser tratados por prestadores contratados, parceiros
            operacionais ou plataformas de tecnologia, nas finalidades informadas abaixo:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Parceiros de entrega</strong> — nome e endereço para realizar a entrega do
              pedido.
            </li>
            <li>
              <strong>Processadores de pagamento</strong> — para processar transações de forma
              segura.
            </li>
            <li>
              <strong>Plataformas de tecnologia</strong> — Supabase (banco de dados), Meta/WhatsApp
              (comunicação), Vercel (hospedagem), OpenAI (IA de atendimento) e, quando houver
              consentimento para métricas, Google Analytics e Microsoft Clarity. Cada fornecedor possui sua própria
              política de privacidade e seus próprios termos de tratamento de dados.
            </li>
            <li>
              <strong>Autoridades públicas</strong> — quando exigido por lei.
            </li>
          </ul>
          <p className="mt-2">
            Esses prestadores não recebem autorização da SaborosaMente para vender sua
            base de clientes nem utilizá-la para campanhas comerciais independentes.
            O tratamento técnico eventualmente realizado por provedores segue os
            respectivos contratos e políticas. Você pode pedir informações sobre
            essas operações nos canais de contato informados abaixo.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            6. Base legal para tratamento (LGPD)
          </h2>
          <p>
            Tratamos seus dados com base nas seguintes hipóteses da Lei Geral de Proteção de Dados
            (Lei 13.709/2018):
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Execução de contrato</strong> — para processar e entregar seu pedido.
            </li>
            <li>
              <strong>Consentimento</strong> — para envio de comunicações de marketing.
            </li>
            <li>
              <strong>Legítimo interesse</strong> — para melhoria dos serviços e prevenção de
              fraudes.
            </li>
            <li>
              <strong>Cumprimento de obrigação legal</strong> — para fins fiscais e tributários.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">7. Seus direitos</h2>
          <p>Conforme a LGPD, você tem direito a:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Confirmar a existência de tratamento dos seus dados.</li>
            <li>Acessar seus dados pessoais.</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
            <li>Solicitar a portabilidade dos dados.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
            <li>Solicitar a exclusão completa dos seus dados.</li>
          </ul>
          <p className="mt-2">
            Para exercer qualquer desses direitos, entre em contato pelo WhatsApp{" "}
            <strong>+55 47 99160-7757</strong> ou pela página{" "}
            <a href="/fale-conosco" className="text-[#086e45] hover:underline">
              Fale Conosco
            </a>
            .
          </p>
        </section>

        <section id="cookies-metricas" className="scroll-mt-24">
          <h2 className="text-lg font-bold text-gray-800 mb-2">8. Cookies e métricas</h2>
          <p>
            Utilizamos cookies e armazenamento técnico essenciais para manter o carrinho,
            identificar a sessão e permitir as funções necessárias do site. Esses recursos
            funcionam mesmo que você recuse cookies opcionais.
          </p>
          <p className="mt-2">
            <strong>Escolha do visitante:</strong> no aviso “Nosso site utiliza cookies
            para melhorar a navegação, você aceita os cookies?”, o botão <strong>Sim</strong>
            autoriza as ferramentas opcionais de medição Google Analytics 4 e Microsoft
            Clarity. O botão <strong>Não</strong> as mantém desativadas. As duas opções
            permitem navegar, participar do sorteio e comprar normalmente.
            Nenhuma opção é marcada por padrão. Sua preferência é lembrada no navegador
            até que você a altere, limpe os dados armazenados ou revogue a escolha.
          </p>
          <p className="mt-2">
            <strong>Métricas internas:</strong> o site também pode registrar eventos
            operacionais próprios, como páginas abertas, cliques e etapas da compra,
            no banco de dados Supabase, associados a um identificador aleatório
            de navegador. Esses registros não representam necessariamente visitantes
            únicos nem comprovam o recebimento pelos serviços externos.
            Não utilizamos o IP como identificador de visitantes no relatório interno.
          </p>
          <p className="mt-2">
            O Google Analytics é utilizado para medir páginas visitadas, interações, início de
            checkout e compras. Não enviamos nome, e-mail ou telefone ao Google Analytics e não
            utilizamos essa integração para personalização de anúncios.
          </p>
          <p className="mt-2">
            <strong>Participação em sorteios e alterações de escolha:</strong> aceitar
            os termos do sorteio ou ler esta política não substitui uma recusa anterior
            de cookies e não ativa automaticamente o Google Analytics, o Clarity ou
            comunicações promocionais. Uma nova manifestação expressa do visitante
            no botão <strong>Sim</strong> atualiza a preferência anterior, inclusive
            se ele havia escolhido <strong>Não</strong>. O consentimento pode ser
            revogado gratuitamente a qualquer momento no botão abaixo.
          </p>
          <p className="mt-2">
            O Microsoft Clarity analisa cliques, rolagem, mapas de calor e reproduções de navegação
            para identificar dificuldades de uso. Campos de formulários e informações sensíveis
            são mascarados nas gravações. Não enviamos intencionalmente nome, telefone ou e-mail
            como identificadores personalizados ao Clarity; o tratamento de dados da ferramenta
            segue também a política de privacidade da Microsoft.
            O Google Analytics e o Clarity são prestadores externos e podem receber
            dados técnicos de navegação quando você autoriza as métricas;
            por isso, não seria correto afirmar que nenhum dado técnico
            é processado fora dos sistemas da SaborosaMente.
          </p>
          <p className="mt-2">
            No checkout, você pode autorizar mensagens de recuperação de carrinho por
            WhatsApp caso não conclua o pedido. Essa autorização é independente da
            inscrição no sorteio e pode ser retirada desmarcando a opção no checkout
            ou respondendo <strong>PARAR</strong> ao lembrete recebido.
          </p>
          <button
            type="button"
            onClick={() => {
              clearGoogleAnalyticsConsent();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="mt-3 rounded-lg border border-[#086e45]/30 px-3 py-2 text-base font-semibold text-[#086e45] hover:bg-[#086e45]/5"
          >
            Revisar preferências de cookies
          </button>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">9. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra
            acesso não autorizado, alteração, divulgação ou destruição. Nossos dados são armazenados
            em servidores seguros com criptografia em trânsito (HTTPS/TLS) e em repouso.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">10. Retenção de dados</h2>
          <p>
            Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta
            política ou conforme exigido por lei. Dados de pedidos são mantidos por 5 anos para fins
            fiscais. Dados de marketing são eliminados mediante solicitação.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">11. Menores de idade</h2>
          <p>
            Nossos serviços não são direcionados a menores de 18 anos. Não coletamos
            intencionalmente dados de crianças ou adolescentes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">12. Alterações nesta política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças
            significativas via WhatsApp ou e-mail. A data de última atualização está sempre no topo
            desta página.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">13. Contato</h2>
          <p>Para dúvidas, solicitações ou exercício dos seus direitos:</p>
          <ul className="list-none mt-2 space-y-1">
            <li>
              📱 WhatsApp: <strong>+55 47 99160-7757</strong>
            </li>
            <li>
              🌐 Site:{" "}
              <a href="https://www.saborosamente.com" className="text-[#086e45] hover:underline">
                www.saborosamente.com
              </a>
            </li>
            <li>📍 São Bento do Sul — SC — Brasil</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
