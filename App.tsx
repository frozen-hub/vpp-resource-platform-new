import React, { useState } from 'react';
import { AutoScrollTable } from './components/AutoScrollTable';
import { ResourceChart } from './components/ResourceChart';
import { RegistrationModal } from './components/RegistrationModal';
import { MOCK_REGION_STATS, MOCK_CUSTOMERS, CHART_DATA } from './constants';
import { RegionStat, Customer, ChartDataPoint, FormData } from './types';

// Helper for masking name: 张三 -> 张**
const maskName = (name: string) => {
  if (!name) return '';
  return name.charAt(0) + '**';
};

// Helper for masking phone: 13800138000 -> 138****8000
const maskPhone = (phone: string) => {
  if (!phone) return '';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Initialize state with Mock Data so it can be updated
  const [regionStats, setRegionStats] = useState<RegionStat[]>(MOCK_REGION_STATS);
  const [chartData, setChartData] = useState<ChartDataPoint[]>(CHART_DATA);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);

  const handleNewRegistration = (data: FormData) => {
    const capacity = parseFloat(data.capacity) || 0;
    const city = data.city;
    const demandTypeString = data.demandType === '其他' && data.demandTypeOther 
      ? `其他-${data.demandTypeOther}` 
      : data.demandType;

    // --- 1. Update Customer List ---
    const newCustomer: Customer = {
      id: Date.now().toString(), // Simple unique ID
      company_name: data.companyName,
      province: data.province,
      city: data.city,
      capacity_mw: capacity,
      demand_type: demandTypeString,
      industry: data.industryType || '其他',
      contact: data.contactName,
      phone: data.contactPhone
    };
    
    // Add to top of list
    setCustomers(prev => [newCustomer, ...prev]);


    // --- Helper to map form demand type to data keys ---
    const getTypeKey = (type: string) => {
      if (type.includes('光伏')) return 'pv';
      if (type.includes('储能')) return 'storage';
      if (type.includes('充电')) return 'ev';
      if (type.includes('空调')) return 'load';
      return 'other';
    };
    const typeKey = getTypeKey(data.demandType);


    // --- 2. Update Regional Demand Stats ---
    setRegionStats(prev => {
      const existingIndex = prev.findIndex(r => r.city === city);
      if (existingIndex >= 0) {
        // City exists, update values
        const updated = [...prev];
        const item = { ...updated[existingIndex] }; // Copy item
        
        item.site_count += 1;
        item.total_mw += capacity;
        
        if (typeKey === 'pv') item.pv_mw += capacity;
        else if (typeKey === 'storage') item.storage_mw += capacity;
        else if (typeKey === 'ev') item.ev_mw += capacity;
        else if (typeKey === 'load') item.load_mw += capacity;
        else item.other_mw += capacity;

        updated[existingIndex] = item;
        return updated;
      } else {
        // New city, create entry
        const newItem: RegionStat = {
          city,
          site_count: 1,
          pv_mw: typeKey === 'pv' ? capacity : 0,
          storage_mw: typeKey === 'storage' ? capacity : 0,
          ev_mw: typeKey === 'ev' ? capacity : 0,
          load_mw: typeKey === 'load' ? capacity : 0,
          other_mw: typeKey === 'other' ? capacity : 0,
          total_mw: capacity
        };
        return [newItem, ...prev];
      }
    });

    // --- 3. Update Chart Data ---
    setChartData(prev => {
      const existingIndex = prev.findIndex(c => c.name === city);
      if (existingIndex >= 0) {
        // City exists in chart, update values
        const updated = [...prev];
        const item = { ...updated[existingIndex] }; // Copy item
        
        if (typeKey === 'pv') item.pv += capacity;
        else if (typeKey === 'storage') item.storage += capacity;
        else if (typeKey === 'ev') item.ev += capacity;
        else if (typeKey === 'load') item.load += capacity;
        else item.other += capacity;

        updated[existingIndex] = item;
        return updated;
      } else {
        // New city for chart
        const newItem: ChartDataPoint = {
          name: city,
          pv: typeKey === 'pv' ? capacity : 0,
          storage: typeKey === 'storage' ? capacity : 0,
          ev: typeKey === 'ev' ? capacity : 0,
          load: typeKey === 'load' ? capacity : 0,
          other: typeKey === 'other' ? capacity : 0
        };
        return [...prev, newItem];
      }
    });
  };

  return (
    <div className="h-screen bg-white font-sans text-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="py-4 bg-white text-center border-b border-gray-100 shrink-0">
        <h1 className="text-2xl font-extrabold text-slate-700 tracking-wide">
          虚拟电厂资源整合平台
        </h1>
      </header>

      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 py-4 flex flex-col min-h-0">
        
        {/* Main Layout Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          
          {/* LEFT COLUMN: Significantly larger (Demand Table + Resource Chart) 
              Left side is now ~66% (8/12 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
            
            {/* Top Left: Regional Demand Stats */}
            <div className="flex flex-col h-1/2 min-h-0">
              <h2 className="text-base font-bold text-gray-800 mb-2 shrink-0">各地需求量统计</h2>
              <div className="flex-1 overflow-hidden min-h-0">
                <AutoScrollTable<RegionStat>
                  data={regionStats}
                  height="h-full"
                  rowHeight={36}
                  columns={[
                    { header: '城市', accessor: (d) => d.city, className: 'flex-1' },
                    { header: '站点', accessor: (d) => d.site_count, className: 'flex-1' },
                    { header: '光伏', accessor: (d) => d.pv_mw.toFixed(1), className: 'flex-1' },
                    { header: '储能', accessor: (d) => d.storage_mw.toFixed(1), className: 'flex-1' },
                    { header: '充电', accessor: (d) => d.ev_mw.toFixed(1), className: 'flex-1' },
                    { header: '合计', accessor: (d) => d.total_mw.toFixed(1), className: 'flex-1' },
                  ]}
                />
              </div>
            </div>

            {/* Bottom Left: Resource Chart */}
            <div className="flex flex-col h-1/2 min-h-0">
               <ResourceChart data={chartData} />
            </div>

          </div>

          {/* RIGHT COLUMN: Customer List 
              Right side is ~33% (4/12 cols).
              Using minWidth="1000px" to force horizontal scroll if needed, 
              but using flex-1 columns to ensure no empty space on right. */}
          <div className="lg:col-span-4 flex flex-col min-h-0">
            <h2 className="text-base font-bold text-gray-800 mb-2 shrink-0">客户列表</h2>
            <div className="flex-1 overflow-hidden min-h-0"> 
              <AutoScrollTable<Customer>
                data={customers}
                height="h-full"
                rowHeight={40}
                minWidth="1000px" 
                columns={[
                  { 
                    header: '企业名称', 
                    accessor: (d) => <span className="font-medium text-gray-700 truncate block" title={d.company_name}>{d.company_name}</span>, 
                    className: 'min-w-[180px] flex-1' 
                  },
                  { 
                    header: '省份', 
                    accessor: (d) => d.province, 
                    className: 'min-w-[60px] flex-1' 
                  },
                  { 
                    header: '城市', 
                    accessor: (d) => d.city, 
                    className: 'min-w-[60px] flex-1' 
                  },
                  { 
                    header: '容量(MW)', 
                    accessor: (d) => <span className="text-blue-600 font-bold">{d.capacity_mw}</span>, 
                    className: 'min-w-[80px] flex-1' 
                  },
                  { 
                    header: '需求类型', 
                    accessor: (d) => (
                      <span className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${d.demand_type.includes('光伏') ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {d.demand_type}
                      </span>
                    ), 
                    className: 'min-w-[100px] flex-1' 
                  },
                  { 
                    header: '行业', 
                    accessor: (d) => d.industry, 
                    className: 'min-w-[100px] flex-1' 
                  },
                  { 
                    header: '联系人', 
                    accessor: (d) => maskName(d.contact), 
                    className: 'min-w-[80px] flex-1' 
                  },
                  { 
                    header: '电话', 
                    accessor: (d) => maskPhone(d.phone), 
                    className: 'min-w-[120px] flex-1' 
                  },
                ]}
              />
            </div>
          </div>

        </div>

        {/* Bottom Section: Registration Trigger */}
        <div className="mt-4 pt-2 pb-2 text-center shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-12 rounded-lg shadow-lg transform transition hover:scale-105 hover:shadow-xl flex items-center justify-center mx-auto gap-2 text-sm"
          >
            <span>+</span> 登记我的资源
          </button>
        </div>
      </main>

      {/* Registration Modal */}
      <RegistrationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleNewRegistration}
      />

    </div>
  );
}

export default App;