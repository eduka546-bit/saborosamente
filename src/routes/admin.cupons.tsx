import { createFileRoute } from "@tanstack/react-router";
import { Ticket, Plus, Search, Filter, Calendar, Trash2, Edit3, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/cupons")({
  component: AdminCuponsPage,
});

function AdminCuponsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCupom, setEditingCupom] = useState<any>(null);

  const [cupons, setCupons] = useState([
    { id: 1, codigo: "PRIMEIRACOMPRA", tipo: "Fixo", valor: 10, status: "Ativo", validade: "2026-12-31", uso: 45, regra: "Mínimo R$ 50" },
    { id: 2, codigo: "SABOR15", tipo: "Percentual", valor: 15, status: "Ativo", validade: "2026-08-30", uso: 128, regra: "Sem mínimo" },
    { id: 3, codigo: "MARMITAFREE", tipo: "Entrega Grátis", valor: 0, status: "Pausado", validade: "2026-06-15", uso: 12, regra: "Mínimo R$ 100" },
  ]);

  const handleToggleStatus = (id: number) => {
    setCupons(prev => prev.map(c => 
      c.id === id ? { ...c, status: c.status === "Ativo" ? "Pausado" : "Ativo" } : c
    ));
  };

  const handleEdit = (cupom: any) => {
    setEditingCupom(cupom);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCupom = {
      id: editingCupom?.id || Date.now(),
      codigo: formData.get("codigo") as string,
      tipo: formData.get("tipo") as string,
      valor: Number(formData.get("valor")),
      regra: formData.get("regra") as string,
      validade: formData.get("validade") as string,
      status: editingCupom?.status || "Ativo",
      uso: editingCupom?.uso || 0,
    };

    if (editingCupom) {
      setCupons(prev => prev.map(c => c.id === editingCupom.id ? newCupom : c));
    } else {
      setCupons(prev => [...prev, newCupom]);
    }
    setIsModalOpen(false);
    setEditingCupom(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Cupons de Desconto</h1>
          <p className="text-gray-500 text-sm mt-1">Crie e gerencie ofertas para atrair mais clientes.</p>
        </div>
        <Button 
          onClick={() => { setEditingCupom(null); setIsModalOpen(true); }}
          className="bg-[#5850ec] hover:bg-[#5850ec]/90 flex items-center gap-2 rounded-md px-4 h-10 text-xs font-bold uppercase tracking-wider text-white"
        >
          <Plus size={18} /> Novo Cupom
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Buscar por código..." 
              className="pl-10 rounded-lg border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2 rounded-lg border-gray-200">
            <Filter size={18} /> Filtros
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cupons.filter(c => c.codigo.toLowerCase().includes(searchTerm.toLowerCase())).map((cupom) => (
          <div key={cupom.id} className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${cupom.status === 'Ativo' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                <Ticket size={24} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(cupom)} className="text-gray-400 hover:text-[#5850ec] transition-colors"><Edit3 size={18} /></button>
                <button 
                  onClick={() => handleToggleStatus(cupom.id)}
                  className={`transition-colors ${cupom.status === 'Ativo' ? 'text-green-500 hover:text-green-600' : 'text-gray-300 hover:text-green-400'}`}
                >
                  <CheckCircle2 size={18} />
                </button>
                <button className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Código</p>
              <h3 className="text-xl font-black text-gray-900">{cupom.codigo}</h3>
              <p className="text-xs text-[#5850ec] font-bold mt-1">{cupom.regra}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Desconto</p>
                <p className="font-bold text-gray-800">{cupom.tipo === 'Percentual' ? `${cupom.valor}%` : cupom.tipo === 'Entrega Grátis' ? 'Grátis' : `R$ ${cupom.valor},00`}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Usos</p>
                <p className="font-bold text-gray-800">{cupom.uso} vezes</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Badge className={cupom.status === 'Ativo' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                {cupom.status}
              </Badge>
              <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                <Calendar size={12} /> Expira em {new Date(cupom.validade).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-6 text-[#5850ec]">{editingCupom ? 'Editar Cupom' : 'Novo Cupom'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Código do Cupom</label>
                <Input name="codigo" defaultValue={editingCupom?.codigo} required placeholder="EX: SABOR20" className="uppercase font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Tipo</label>
                  <select name="tipo" defaultValue={editingCupom?.tipo || "Fixo"} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="Fixo">Fixo (R$)</option>
                    <option value="Percentual">Percentual (%)</option>
                    <option value="Entrega Grátis">Entrega Grátis</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Valor</label>
                  <Input name="valor" type="number" defaultValue={editingCupom?.valor} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Regra / Descrição</label>
                <Input name="regra" defaultValue={editingCupom?.regra} placeholder="EX: Mínimo R$ 100" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Data de Validade</label>
                <Input name="validade" type="date" defaultValue={editingCupom?.validade} required />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-[#5850ec] text-white">Salvar Cupom</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

