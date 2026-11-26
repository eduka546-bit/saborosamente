import { createFileRoute } from "@tanstack/react-router";
import { processEmailMarketingDay } from "@/lib/email-marketing-worker";

export const Route = createFileRoute("/api/email-marketing-tick")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret=process.env.CRON_SECRET;
        if(!secret || request.headers.get("authorization")!=="Bearer "+secret) {
          return Response.json({error:"Não autorizado"},{status:401});
        }
        try {
          const result=await processEmailMarketingDay();
          return Response.json(result,{status:200,headers:{"Cache-Control":"no-store"}});
        }catch(error){
          console.error("[email-marketing-cron] erro ao processar a fila",error);
          return Response.json({error:"Falha ao executar fila; nenhum envio será repetido automaticamente."},{status:500});
        }
      },
    },
  },
});
