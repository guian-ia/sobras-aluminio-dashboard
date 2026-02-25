import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  Package,
  ShoppingCart,
  ArrowRightLeft,
  FileText,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  User,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import * as XLSX from 'xlsx';

// Types
interface StockData {
  month: string;
  estoqueAnterior: number;
  compras: number;
  devolucaoCompra: number;
  vendas: number;
  devolucaoVenda: number;
  estoqueFinal: number;
}

interface Purchase {
  id: string;
  item: string;
  quantity: number;
  supplier: string;
  expectedDate: string;
  status: 'pending' | 'received' | 'cancelled';
  createdAt: string;
}

interface Transfer {
  id: string;
  item: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
}

interface AppContextType {
  stockData: StockData[];
  purchases: Purchase[];
  transfers: Transfer[];
  addPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt'>) => void;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => void;
  deletePurchase: (id: string) => void;
  addTransfer: (transfer: Omit<Transfer, 'id'>) => void;
  updateTransfer: (id: string, transfer: Partial<Transfer>) => void;
  deleteTransfer: (id: string) => void;
  lowStockThreshold: number;
  setLowStockThreshold: (value: number) => void;
}

// Sample data based on Excel file
const sampleStockData: StockData[] = [
  { month: 'Abril', estoqueAnterior: 256622.01, compras: 1206500.324, devolucaoCompra: 0, vendas: 906827.55, devolucaoVenda: 0, estoqueFinal: 556294.764 },
  { month: 'Maio', estoqueAnterior: 556294.764, compras: 1456230.50, devolucaoCompra: 0, vendas: 1124567.89, devolucaoVenda: 0, estoqueFinal: 887957.374 },
  { month: 'Junho', estoqueAnterior: 887957.374, compras: 987654.32, devolucaoCompra: 0, vendas: 1345678.90, devolucaoVenda: 0, estoqueFinal: 532932.794 },
  { month: 'Julho', estoqueAnterior: 532932.794, compras: 1678901.23, devolucaoCompra: 0, vendas: 1456234.56, devolucaoVenda: 0, estoqueFinal: 755599.454 },
  { month: 'Agosto', estoqueAnterior: 755599.454, compras: 1234567.89, devolucaoCompra: 0, vendas: 1123456.78, devolucaoVenda: 0, estoqueFinal: 866710.564 },
  { month: 'Setembro', estoqueAnterior: 866710.564, compras: 1567890.12, devolucaoCompra: 0, vendas: 1678901.23, devolucaoVenda: 0, estoqueFinal: 754699.454 },
  { month: 'Outubro', estoqueAnterior: 754699.454, compras: 1890123.45, devolucaoCompra: 0, vendas: 1789012.34, devolucaoVenda: 0, estoqueFinal: 755810.564 },
  { month: 'Novembro', estoqueAnterior: 755810.564, compras: 1345678.90, devolucaoCompra: 0, vendas: 1456234.56, devolucaoVenda: 0, estoqueFinal: 645254.904 },
];

const samplePurchases: Purchase[] = [
  { id: '1', item: 'Alumínio Lingote', quantity: 5000, supplier: 'Metalúrgica ABC', expectedDate: '2024-12-15', status: 'pending', createdAt: '2024-12-01' },
  { id: '2', item: 'Alumínio Liga 6063', quantity: 3000, supplier: 'Industrias XYZ', expectedDate: '2024-12-20', status: 'pending', createdAt: '2024-12-05' },
  { id: '3', item: 'Alumínio Reciclado', quantity: 8000, supplier: 'Reciclagem Verde', expectedDate: '2024-12-10', status: 'received', createdAt: '2024-11-28' },
];

const sampleTransfers: Transfer[] = [
  { id: '1', item: 'Alumínio Lingote', quantity: 2000, fromLocation: 'Armazém A', toLocation: 'Produção Linha 1', date: '2024-12-01', status: 'completed' },
  { id: '2', item: 'Alumínio Liga 6063', quantity: 1500, fromLocation: 'Armazém B', toLocation: 'Produção Linha 2', date: '2024-12-05', status: 'completed' },
  { id: '3', item: 'Alumínio Reciclado', quantity: 3000, fromLocation: 'Armazém A', toLocation: 'Produção Linha 3', date: '2024-12-10', status: 'pending' },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Sidebar Component
const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const menuItems = [
    { id: 'estoque', label: 'Estoque', icon: Package },
    { id: 'compras', label: 'Compras', icon: ShoppingCart },
    { id: 'transferencias', label: 'Transferências', icon: ArrowRightLeft },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 z-50 h-full w-64 bg-primary text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Sobras Alumínio</h1>
              <p className="text-xs text-white/70">Gestão de Estoque</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Administrador</p>
              <p className="text-xs text-white/70">admin@sobras.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Header Component
const Header = ({ title, setIsOpen }: { title: string; setIsOpen: (open: boolean) => void }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
          />
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
        </button>
      </div>
    </header>
  );
};

// KPI Card Component
const KPICard = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  unit = ''
}: {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  unit?: string;
}) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-danger';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            {unit && <span className="text-lg font-normal text-gray-500 ml-1">{unit}</span>}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${getChangeColor()}`}>
              {changeType === 'positive' ? <TrendingUp className="w-4 h-4" /> : changeType === 'negative' ? <TrendingDown className="w-4 h-4" /> : null}
              <span>{change > 0 ? '+' : ''}{change}%</span>
              <span className="text-gray-400">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'pending':
      case 'Pendente':
        return 'bg-warning/10 text-warning';
      case 'received':
      case 'Recebido':
        return 'bg-success/10 text-success';
      case 'cancelled':
      case 'Cancelado':
        return 'bg-danger/10 text-danger';
      case 'completed':
      case 'Concluído':
        return 'bg-success/10 text-success';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'received':
        return 'Recebido';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle()}`}>
      {getStatusLabel()}
    </span>
  );
};

// Estoque Tab Component
const EstoqueTab = () => {
  const { stockData, lowStockThreshold } = useApp();
  const latestData = stockData[stockData.length - 1];
  const previousData = stockData[stockData.length - 2];

  const totalCompras = stockData.reduce((acc, item) => acc + item.compras, 0);
  const totalVendas = stockData.reduce((acc, item) => acc + item.vendas, 0);
  const avgMonthly = (latestData.estoqueFinal / 1000).toFixed(1);

  const formatNumber = (num: number) => num.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Estoque Atual"
          value={formatNumber(latestData.estoqueFinal)}
          unit="KG"
          change={Number(((latestData.estoqueFinal - previousData.estoqueFinal) / previousData.estoqueFinal * 100).toFixed(1))}
          changeType={(latestData.estoqueFinal > previousData.estoqueFinal) ? 'positive' : 'negative'}
          icon={Package}
        />
        <KPICard
          title="Total Compras (Ano)"
          value={formatNumber(totalCompras)}
          unit="KG"
          icon={ShoppingCart}
        />
        <KPICard
          title="Total Vendas (Ano)"
          value={formatNumber(totalVendas)}
          unit="KG"
          icon={TrendingDown}
        />
        <KPICard
          title="Média Mensal"
          value={avgMonthly}
          unit="Ton"
          icon={TrendingUp}
        />
      </div>

      {/* Stock Trend Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolução do Estoque</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stockData}>
              <defs>
                <linearGradient id="colorEstoque" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0F4C81" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                formatter={(value: number) => [value.toLocaleString('pt-BR') + ' KG', 'Estoque']}
              />
              <Area
                type="monotone"
                dataKey="estoqueFinal"
                stroke="#0F4C81"
                fillOpacity={1}
                fill="url(#colorEstoque)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Details Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalhes Mensais</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Mês</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Estoque Anterior</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Compras</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Vendas</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Estoque Final</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {stockData.map((item, index) => (
                <tr key={item.month} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.month}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">{formatNumber(item.estoqueAnterior)}</td>
                  <td className="py-3 px-4 text-sm text-success text-right">{formatNumber(item.compras)}</td>
                  <td className="py-3 px-4 text-sm text-danger text-right">{formatNumber(item.vendas)}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-800 text-right">{formatNumber(item.estoqueFinal)}</td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={item.estoqueFinal > lowStockThreshold * 1000 ? 'completed' : 'pending'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Compras Tab Component
const ComprasTab = () => {
  const { purchases, addPurchase, updatePurchase, deletePurchase } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [newPurchase, setNewPurchase] = useState({
    item: '',
    quantity: 0,
    supplier: '',
    expectedDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPurchase({
      ...newPurchase,
      status: 'pending',
    });
    setShowForm(false);
    setNewPurchase({ item: '', quantity: 0, supplier: '', expectedDate: '' });
  };

  const pendingCount = purchases.filter(p => p.status === 'pending').length;
  const receivedCount = purchases.filter(p => p.status === 'received').length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Pedidos Pendentes"
          value={pendingCount}
          changeType="neutral"
          icon={Clock}
        />
        <KPICard
          title="Pedidos Recebidos"
          value={receivedCount}
          changeType="positive"
          icon={CheckCircle}
        />
        <KPICard
          title="Total de Pedidos"
          value={purchases.length}
          changeType="neutral"
          icon={ShoppingCart}
        />
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Pedidos de Compra</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Pedido
        </button>
      </div>

      {/* New Purchase Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Novo Pedido de Compra</h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <input
                type="text"
                required
                value={newPurchase.item}
                onChange={(e) => setNewPurchase({...newPurchase, item: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Nome do item"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade (KG)</label>
              <input
                type="number"
                required
                value={newPurchase.quantity}
                onChange={(e) => setNewPurchase({...newPurchase, quantity: Number(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
              <input
                type="text"
                required
                value={newPurchase.supplier}
                onChange={(e) => setNewPurchase({...newPurchase, supplier: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Nome do fornecedor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Prevista</label>
              <input
                type="date"
                required
                value={newPurchase.expectedDate}
                onChange={(e) => setNewPurchase({...newPurchase, expectedDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="md:col-span-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Salvar Pedido
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Purchases Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Item</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Quantidade</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Fornecedor</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Data Prevista</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{purchase.item}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">{purchase.quantity.toLocaleString('pt-BR')} KG</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{purchase.supplier}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{new Date(purchase.expectedDate).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={purchase.status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      {purchase.status === 'pending' && (
                        <button
                          onClick={() => updatePurchase(purchase.id, { status: 'received' })}
                          className="p-1 text-success hover:bg-success/10 rounded"
                          title="Marcar como Recebido"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deletePurchase(purchase.id)}
                        className="p-1 text-danger hover:bg-danger/10 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Transferencias Tab Component
const TransferenciasTab = () => {
  const { transfers, addTransfer, updateTransfer, deleteTransfer } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    item: '',
    quantity: 0,
    fromLocation: '',
    toLocation: '',
    date: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTransfer({
      ...newTransfer,
      status: 'pending',
    });
    setShowForm(false);
    setNewTransfer({ item: '', quantity: 0, fromLocation: '', toLocation: '', date: '' });
  };

  const completedCount = transfers.filter(t => t.status === 'completed').length;
  const pendingCount = transfers.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Transferências Concluídas"
          value={completedCount}
          changeType="positive"
          icon={CheckCircle}
        />
        <KPICard
          title="Transferências Pendentes"
          value={pendingCount}
          changeType="neutral"
          icon={Clock}
        />
        <KPICard
          title="Total de Transferências"
          value={transfers.length}
          changeType="neutral"
          icon={ArrowRightLeft}
        />
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Registro de Transferências</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Transferência
        </button>
      </div>

      {/* New Transfer Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Nova Transferência</h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <input
                type="text"
                required
                value={newTransfer.item}
                onChange={(e) => setNewTransfer({...newTransfer, item: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Nome do item"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade (KG)</label>
              <input
                type="number"
                required
                value={newTransfer.quantity}
                onChange={(e) => setNewTransfer({...newTransfer, quantity: Number(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local de Origem</label>
              <select
                required
                value={newTransfer.fromLocation}
                onChange={(e) => setNewTransfer({...newTransfer, fromLocation: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Selecione...</option>
                <option value="Armazém A">Armazém A</option>
                <option value="Armazém B">Armazém B</option>
                <option value="Produção Linha 1">Produção Linha 1</option>
                <option value="Produção Linha 2">Produção Linha 2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local de Destino</label>
              <select
                required
                value={newTransfer.toLocation}
                onChange={(e) => setNewTransfer({...newTransfer, toLocation: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Selecione...</option>
                <option value="Armazém A">Armazém A</option>
                <option value="Armazém B">Armazém B</option>
                <option value="Produção Linha 1">Produção Linha 1</option>
                <option value="Produção Linha 2">Produção Linha 2</option>
                <option value="Produção Linha 3">Produção Linha 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                required
                value={newTransfer.date}
                onChange={(e) => setNewTransfer({...newTransfer, date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="md:col-span-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Salvar Transferência
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transfers Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Item</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Quantidade</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">De</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Para</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Data</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => (
                <tr key={transfer.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{transfer.item}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">{transfer.quantity.toLocaleString('pt-BR')} KG</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{transfer.fromLocation}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{transfer.toLocation}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{new Date(transfer.date).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={transfer.status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      {transfer.status === 'pending' && (
                        <button
                          onClick={() => updateTransfer(transfer.id, { status: 'completed' })}
                          className="p-1 text-success hover:bg-success/10 rounded"
                          title="Concluir"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteTransfer(transfer.id)}
                        className="p-1 text-danger hover:bg-danger/10 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Relatorios Tab Component
const RelatoriosTab = () => {
  const { stockData } = useApp();

  const COLORS = ['#0F4C81', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Data for charts
  const monthlyData = stockData.map(item => ({
    name: item.month,
    compras: item.compras / 1000,
    vendas: item.vendas / 1000,
    estoque: item.estoqueFinal / 1000,
  }));

  const pieData = [
    { name: 'Compras', value: stockData.reduce((acc, item) => acc + item.compras, 0) },
    { name: 'Vendas', value: stockData.reduce((acc, item) => acc + item.vendas, 0) },
    { name: 'Estoque Final', value: stockData[stockData.length - 1].estoqueFinal },
  ];

  return (
    <div className="space-y-6">
      {/* Chart 1: Monthly Comparison */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Comparativo Mensal (Toneladas)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                formatter={(value: number) => [value.toFixed(2) + ' Ton', '']}
              />
              <Legend />
              <Bar dataKey="compras" name="Compras" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="vendas" name="Vendas" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="estoque" name="Estoque" fill="#0F4C81" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Stock Evolution Line */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolução do Estoque</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  formatter={(value: number) => [value.toLocaleString('pt-BR') + ' KG', '']}
                />
                <Line
                  type="monotone"
                  dataKey="estoqueFinal"
                  name="Estoque Final"
                  stroke="#0F4C81"
                  strokeWidth={3}
                  dot={{ fill: '#0F4C81', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Distribution Pie */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição de Movimentação</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  formatter={(value: number) => [value.toLocaleString('pt-BR') + ' KG', '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex justify-end gap-4">
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-5 h-5" />
          Exportar PDF
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-5 h-5" />
          Exportar Excel
        </button>
      </div>
    </div>
  );
};

// Configuracoes Tab Component
const ConfiguracoesTab = () => {
  const { lowStockThreshold, setLowStockThreshold } = useApp();
  const [threshold, setThreshold] = useState(lowStockThreshold);

  const handleSaveThreshold = () => {
    setLowStockThreshold(threshold);
  };

  return (
    <div className="space-y-6">
      {/* Data Management */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Gerenciamento de Dados</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">Importar Dados do Excel</h4>
              <p className="text-sm text-gray-500">Atualize os dados do estoque com um novo arquivo</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <Upload className="w-5 h-5" />
              Importar
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">Exportar Dados</h4>
              <p className="text-sm text-gray-500">Baixe todos os dados em formato Excel</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-5 h-5" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Stock Thresholds */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações de Estoque</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Limite de Estoque Baixo (KG)
            </label>
            <div className="flex gap-4">
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="1000"
              />
              <button
                onClick={handleSaveThreshold}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Salvar
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Itens com estoque abaixo deste valor serão marcados como "Estoque Baixo"
            </p>
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações da Empresa</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
            <input
              type="text"
              defaultValue="Sobras Alumínio"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <input
              type="text"
              defaultValue="XX.XXX.XXX/XXXX-XX"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input
              type="text"
              defaultValue="Rua Example, 123"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="text"
              defaultValue="(XX) XXXXX-XXXX"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

// App Provider
const AppProvider = ({ children }: { children: ReactNode }) => {
  const [stockData, setStockData] = useState<StockData[]>(sampleStockData);
  const [purchases, setPurchases] = useState<Purchase[]>(samplePurchases);
  const [transfers, setTransfers] = useState<Transfer[]>(sampleTransfers);
  const [lowStockThreshold, setLowStockThreshold] = useState(1000);

  const addPurchase = (purchase: Omit<Purchase, 'id' | 'createdAt'>) => {
    const newPurchase: Purchase = {
      ...purchase,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
    };
    setPurchases([...purchases, newPurchase]);
  };

  const updatePurchase = (id: string, purchase: Partial<Purchase>) => {
    setPurchases(purchases.map(p => p.id === id ? { ...p, ...purchase } : p));
  };

  const deletePurchase = (id: string) => {
    setPurchases(purchases.filter(p => p.id !== id));
  };

  const addTransfer = (transfer: Omit<Transfer, 'id'>) => {
    const newTransfer: Transfer = {
      ...transfer,
      id: String(Date.now()),
    };
    setTransfers([...transfers, newTransfer]);
  };

  const updateTransfer = (id: string, transfer: Partial<Transfer>) => {
    setTransfers(transfers.map(t => t.id === id ? { ...t, ...transfer } : t));
  };

  const deleteTransfer = (id: string) => {
    setTransfers(transfers.filter(t => t.id !== id));
  };

  return (
    <AppContext.Provider value={{
      stockData,
      purchases,
      transfers,
      addPurchase,
      updatePurchase,
      deletePurchase,
      addTransfer,
      updateTransfer,
      deleteTransfer,
      lowStockThreshold,
      setLowStockThreshold,
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('estoque');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'estoque':
        return 'Controle de Estoque';
      case 'compras':
        return 'Gestão de Compras';
      case 'transferencias':
        return 'Transferências';
      case 'relatorios':
        return 'Relatórios';
      case 'configuracoes':
        return 'Configurações';
      default:
        return 'Sobras Alumínio';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'estoque':
        return <EstoqueTab />;
      case 'compras':
        return <ComprasTab />;
      case 'transferencias':
        return <TransferenciasTab />;
      case 'relatorios':
        return <RelatoriosTab />;
      case 'configuracoes':
        return <ConfiguracoesTab />;
      default:
        return <EstoqueTab />;
    }
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        <div className="lg:ml-64">
          <Header title={getTabTitle()} setIsOpen={setSidebarOpen} />

          <main className="p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </AppProvider>
  );
}

export default App;
