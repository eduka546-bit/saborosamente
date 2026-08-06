import { createFileRoute } from "@tanstack/react-router";
import { Settings, MapPin, DollarSign, Clock, Store, Info, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/taxas")({
  component: AdminConfigTaxasPage,
});

function AdminConfigTaxasPage() {
  const [locais, setLocais] = useState([
    // São Bento do Sul
    { id: 1, bairro: "Centro (SBS)", taxa: 8.90, tempo: "30-45 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 2, bairro: "Progresso (SBS)", taxa: 8.90, tempo: "30-45 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 3, bairro: "25 de Julho (SBS)", taxa: 10.50, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 4, bairro: "Alpino (SBS)", taxa: 17.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 5, bairro: "Boehmerwald (SBS)", taxa: 10.50, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 6, bairro: "Brasília (SBS)", taxa: 12.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 7, bairro: "Centenário (SBS)", taxa: 10.50, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 8, bairro: "Colonial (SBS)", taxa: 10.50, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 9, bairro: "Cruzeiro (SBS)", taxa: 10.50, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 10, bairro: "Industrial Sudoeste (SBS)", taxa: 11.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 11, bairro: "Loteamento Itália (SBS)", taxa: 9.50, tempo: "30-45 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 12, bairro: "Mato Preto (SBS)", taxa: 12.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 13, bairro: "Oxford (SBS)", taxa: 11.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 14, bairro: "Parque Mariani (SBS)", taxa: 9.50, tempo: "30-45 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 15, bairro: "Residencial Santa Fé (SBS)", taxa: 12.50, tempo: "45-70 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 16, bairro: "Rio Negro (SBS)", taxa: 10.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 17, bairro: "Schramm (SBS)", taxa: 9.00, tempo: "30-45 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 18, bairro: "Serra Alta (SBS)", taxa: 13.00, tempo: "45-70 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 19, bairro: "Dona Francisca (SBS)", taxa: 15.00, tempo: "50-80 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 20, bairro: "Bela Aliança (SBS)", taxa: 10.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 21, bairro: "Campo do Meio (SBS)", taxa: 10.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 22, bairro: "Castelo Branco (SBS)", taxa: 10.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 23, bairro: "Estrada das Neves (SBS)", taxa: 10.00, tempo: "45-70 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 24, bairro: "Estrada dos Bugres (SBS)", taxa: 10.00, tempo: "45-70 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 25, bairro: "Lençol (SBS)", taxa: 10.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 26, bairro: "Rio Natal (SBS)", taxa: 10.00, tempo: "50-80 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 27, bairro: "Rio Represo (SBS)", taxa: 10.00, tempo: "50-80 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 28, bairro: "Rio Vermelho Estação (SBS)", taxa: 10.00, tempo: "50-80 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 29, bairro: "Rio Vermelho Povoado (SBS)", taxa: 10.00, tempo: "50-80 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 30, bairro: "Sertãozinho (SBS)", taxa: 10.00, tempo: "45-70 min", ativo: true, cidade: "São Bento do Sul" },

    // Rio Negrinho
    { id: 31, bairro: "Ceramarte", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 32, bairro: "Alegre", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 33, bairro: "Bairro Preto", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 34, bairro: "Barro Preto", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 35, bairro: "Bela Vista", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 36, bairro: "Campo Lençol", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 37, bairro: "Centro (RN)", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 38, bairro: "Colônia Olsen", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 39, bairro: "Cruzeiro (RN)", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 40, bairro: "Industrial Norte", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 41, bairro: "Industrial Sul", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 42, bairro: "Jardim Hantschel", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 43, bairro: "Pinheirinho", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 44, bairro: "Quitandinha", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 45, bairro: "Rio Casa de Pedra", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 46, bairro: "Rio Preto", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 47, bairro: "Rio dos Bugres", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 48, bairro: "Serro Azul", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 49, bairro: "São Pedro", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 50, bairro: "São Rafael", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 51, bairro: "Vila Nova", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 52, bairro: "Vista Alegre", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 53, bairro: "Volta Grande", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
  ]);

  const [isAdding, setIsAdding] = useState(false);

  const handleAddLocal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const novo = {
      id: Date.now(),
      bairro: formData.get("bairro") as string,
      taxa: Number(formData.get("taxa")),
      tempo: formData.get("tempo") as string,
      ativo: true,
      cidade: formData.get("cidade") as string
    };
    setLocais([...locais, novo]);
    setIsAdding(false);
    toast.success("Local de entrega adicionado!");
  };


  const handleRemoveLocal = (id: number) => {
    setLocais(locais.filter(l => l.id !== id));
    toast.success("Local removido.");
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Entregas e Locais</h1>
          <p className="text-gray-500 text-sm mt-1">Configure taxas por bairro e tempos estimados.</p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-[#5850ec] hover:bg-[#5850ec]/90 flex items-center gap-2"
        >
          <Plus size={18} /> Adicionar Bairro
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <MapPin size={18} className="text-[#5850ec]" /> Bairros Atendidos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-widest border-b">
                    <tr>
                      <th className="px-6 py-4">Bairro / Região</th>
                      <th className="px-6 py-4">Cidade</th>
                      <th className="px-6 py-4">Taxa (R$)</th>
                      <th className="px-6 py-4">Tempo Est.</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {locais.map((local) => (
                      <tr key={local.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{local.bairro}</td>
                        <td className="px-6 py-4 text-gray-500">{local.cidade || "N/A"}</td>
                        <td className="px-6 py-4 text-green-600 font-bold">R$ {local.taxa.toFixed(2)}</td>
                        <td className="px-6 py-4 text-gray-500 flex items-center gap-1">
                          <Clock size={14} /> {local.tempo}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-gray-400 hover:text-red-500"
                            onClick={() => handleRemoveLocal(local.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Settings size={18} className="text-[#5850ec]" /> Regras Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-400">Frete Grátis a partir de (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input defaultValue="120.00" className="pl-10 font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-400">Tempo Geral (min)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input defaultValue="45-60" className="pl-10 font-bold" />
                </div>
              </div>
              <Button className="w-full bg-[#5850ec] mt-4">Salvar Configurações</Button>
            </CardContent>
          </Card>

          <Card className="bg-[#5850ec]/5 border-[#5850ec]/10">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-[#5850ec] flex items-center justify-center text-white shrink-0">
                  <Store size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Retirada no Local</h4>
                  <p className="text-xs text-gray-500">Permite que o cliente retire o pedido sem taxa de entrega.</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-4 w-8 bg-[#5850ec] rounded-full relative">
                      <div className="absolute right-1 top-1 h-2 w-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-xs font-bold text-[#5850ec]">Ativo</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6 text-[#5850ec]">Novo Bairro de Entrega</h2>
            <form onSubmit={handleAddLocal} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Cidade</label>
                <Input name="cidade" required placeholder="EX: Rio Negrinho" />
              </div>
              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Taxa (R$)</label>
                  <Input name="taxa" type="number" step="0.01" required placeholder="5.00" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Tempo Est.</label>
                  <Input name="tempo" required placeholder="30-45 min" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-[#5850ec] text-white">Adicionar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
