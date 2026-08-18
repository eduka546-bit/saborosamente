import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade | SaborosaMente" },
      { name: "description", content: "Política de privacidade e tratamento de dados da SaborosaMente." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  const dataAtualizacao = "18 de agosto de 2026";

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-[#086e45] mb-2">Política de Privacidade</h1>
      <p className="text-sm text-gray-400 mb-10">Última atualização: {dataAtualizacao}</p>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-8">

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">1. Sobre a SaborosaMente</h2>
          <p>
            A <strong>SaborosaMente</strong> é uma empresa especializada em marmitas congeladas artesanais,
            com sede em São Bento do Sul/SC. Fornecemos refeições práticas, saudáveis e saborosas
            para delivery e retirada na loja.
          </p>
          <p className="mt-2">
            Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos
            suas informações pessoais ao utilizar nosso site (<strong>saborosamente.vercel.app</strong>),
            nosso atendimento via WhatsApp e demais serviços.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">2. Dados que coletamos</h2>
          <p>Coletamos as seguintes categorias de dados:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Dados de identificação:</strong> nome completo, CPF (para cadastro).</li>
            <li><strong>Dados de contato:</strong> e-mail, número de telefone/WhatsApp.</li>
            <li><strong>Dados de entrega:</strong> endereço completo, cidade, bairro, CEP.</li>
            <li><strong>Dados de pedidos:</strong> itens comprados, valores, forma de pagamento, histórico de compras.</li>
            <li><strong>Dados de navegação:</strong> páginas acessadas, tempo de sessão, dispositivo e navegador (via cookies técnicos).</li>
            <li><strong>Dados de comunicação:</strong> mensagens trocadas via WhatsApp, incluindo conversas com nosso assistente virtual (Saborosa).</li>
            <li><strong>Dados de cashback:</strong> saldo acumulado e histórico de transações de cashback.</li>
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
            <li>Recuperar carrinhos abandonados com ofertas personalizadas.</li>
            <li>Cumprir obrigações legais e fiscais.</li>
            <li>Melhorar nossos produtos, serviços e experiência de compra.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">4. Assistente virtual (WhatsApp IA)</h2>
          <p>
            Nosso atendimento via WhatsApp utiliza inteligência artificial (Saborosa) para responder
            dúvidas, apresentar o cardápio e registrar pedidos. As conversas são armazenadas em nossa
            base de dados para fins de atendimento, treinamento e melhoria do serviço.
          </p>
          <p className="mt-2">
            A qualquer momento você pode solicitar a exclusão do seu histórico de conversa entrando
            em contato pelo WhatsApp <strong>+55 47 99160-7757</strong> ou pelo e-mail de contato da empresa.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">5. Compartilhamento de dados</h2>
          <p>Seus dados <strong>não são vendidos</strong> a terceiros. Podemos compartilhá-los apenas com:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Parceiros de entrega</strong> — nome e endereço para realizar a entrega do pedido.</li>
            <li><strong>Processadores de pagamento</strong> — para processar transações de forma segura.</li>
            <li><strong>Plataformas de tecnologia</strong> — Supabase (banco de dados), Meta/WhatsApp (comunicação), Vercel (hospedagem), OpenAI (IA de atendimento) — todos com políticas de privacidade próprias e conformes com a LGPD/GDPR.</li>
            <li><strong>Autoridades públicas</strong> — quando exigido por lei.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">6. Base legal para tratamento (LGPD)</h2>
          <p>Tratamos seus dados com base nas seguintes hipóteses da Lei Geral de Proteção de Dados (Lei 13.709/2018):</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Execução de contrato</strong> — para processar e entregar seu pedido.</li>
            <li><strong>Consentimento</strong> — para envio de comunicações de marketing.</li>
            <li><strong>Legítimo interesse</strong> — para melhoria dos serviços e prevenção de fraudes.</li>
            <li><strong>Cumprimento de obrigação legal</strong> — para fins fiscais e tributários.</li>
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
            <a href="/fale-conosco" className="text-[#086e45] hover:underline">Fale Conosco</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">8. Cookies</h2>
          <p>
            Utilizamos cookies técnicos essenciais para o funcionamento do site (como manter itens
            no carrinho e sessão de login). Não utilizamos cookies de rastreamento de terceiros para
            publicidade.
          </p>
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
            política ou conforme exigido por lei. Dados de pedidos são mantidos por 5 anos para
            fins fiscais. Dados de marketing são eliminados mediante solicitação.
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
            Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas
            via WhatsApp ou e-mail. A data de última atualização está sempre no topo desta página.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">13. Contato</h2>
          <p>Para dúvidas, solicitações ou exercício dos seus direitos:</p>
          <ul className="list-none mt-2 space-y-1">
            <li>📱 WhatsApp: <strong>+55 47 99160-7757</strong></li>
            <li>🌐 Site: <a href="https://saborosamente.vercel.app" className="text-[#086e45] hover:underline">saborosamente.vercel.app</a></li>
            <li>📍 São Bento do Sul — SC — Brasil</li>
          </ul>
        </section>

      </div>
    </div>
  );
}
