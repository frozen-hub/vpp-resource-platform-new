import React, { useState, useEffect, useMemo } from 'react';
import { AutoScrollTable } from './components/AutoScrollTable';
import { ResourceChart } from './components/ResourceChart';
import { RegistrationModal } from './components/RegistrationModal';
import { supabase } from './supabaseClient';
import { RegionStat, Customer, ChartDataPoint, FormData } from './types';
import { MOCK_CUSTOMERS } from './constants';

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
  const [loading, setLoading] = useState(true);
  
  // Initialize with empty array, waiting for DB fetch
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Derived State (Calculated from customers)
  const [regionStats, setRegionStats] = useState<RegionStat[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // --- Data Aggregation Logic ---
  // This calculates the Table and Chart data whenever 'customers' changes
  useEffect(() => {
    // If we have no customers (and not loading), we might show empty stats
    // But usually if customers is populated (either from DB or Mock), this runs.
    
    if (customers.length === 0) {
      setRegionStats([]);
      setChartData([]);
      return;
    }

    // 1. Group by City
    const cityMap = new Map<string, {
      site_count: number;
      pv_mw: number;
      storage_mw: number;
      ev_mw: number;
      load_mw: number;
      other_mw: number;
      total_mw: number;
    }>();

    customers.forEach(cust => {
      const city = cust.city;
      const cap = Number(cust.capacity_mw) || 0;
      const type = cust.demand_type || '';

      if (!cityMap.has(city)) {
        cityMap.set(city, { site_count: 0, pv_mw: 0, storage_mw: 0, ev_mw: 0, load_mw: 0, other_mw: 0, total_mw: 0 });
      }

      const entry = cityMap.get(city)!;
      entry.site_count += 1;
      entry.total_mw += cap;

      if (type.includes('光伏')) entry.pv_mw += cap;
      else if (type.includes('储能')) entry.storage_mw += cap;
      else if (type.includes('充电')) entry.ev_mw += cap;
      else if (type.includes('空调') || type.includes('负荷')) entry.load_mw += cap;
      else entry.other_mw += cap;
    });

    // 2. Convert to RegionStat Array
    const newRegionStats: RegionStat[] = Array.from(cityMap.entries()).map(([city, data]) => ({
      city,
      ...data
    })).sort((a, b) => b.total_mw - a.total_mw); // Sort by total capacity

    // 3. Convert to ChartDataPoint Array
    const newChartData: ChartDataPoint[] = Array.from(cityMap.entries()).map(([city, data]) => ({
      name: city,
      pv: data.pv_mw,
      storage: data.storage_mw,
      ev: data.ev_mw,
      load: data.load_mw,
      other: data.other_mw
    })).sort((a, b) => (b.pv + b.storage + b.ev + b.load + b.other) - (a.pv + a.storage + a.ev + a.load + a.other));

    setRegionStats(newRegionStats);
    setChartData(newChartData);

  }, [customers]);


  // --- Fetch Data from Supabase ---
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, falling back to mock data:', error.message);
        setCustomers(MOCK_CUSTOMERS);
      } else {
        if (data && data.length > 0) {
          const mappedCustomers: Customer[] = data.map(d => ({
            id: d.id,
            company_name: d.company_name,
            province: d.province,
            city: d.city,
            capacity_mw: Number(d.capacity_mw),
            demand_type: d.demand_type,
            industry: d.industry || '',
            contact: d.contact_name || '',
            phone: d.contact_phone || ''
          }));
          setCustomers(mappedCustomers);
        } else {
          // If DB is empty, also use Mock Data so the user sees something
          console.log('Supabase returned empty, using mock data for demo.');
          setCustomers(MOCK_CUSTOMERS);
        }
      }
    } catch (err) {
      console.warn('Supabase connection error, falling back to mock data.');
      setCustomers(MOCK_CUSTOMERS);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRegistration = async (data: FormData) => {
    const capacity = parseFloat(data.capacity) || 0;
    const demandTypeString = data.demandType === '其他' && data.demandTypeOther 
      ? `其他-${data.demandTypeOther}` 
      : data.demandType;

    // 1. Prepare Payload
    const dbPayload = {
      company_name: data.companyName,
      province: data.province,
      city: data.city,
      district: data.district,
      address: data.address,
      capacity_mw: capacity,
      demand_type: demandTypeString,
      industry: data.industryType,
      contact_name: data.contactName,
      contact_phone: data.contactPhone,
      contact_email: data.contactEmail
    };

    // 2. Try Insert into DB
    try {
        const { error } = await supabase
        .from('customers')
        .insert([dbPayload]);

        if (error) {
            console.warn('DB Insert failed, updating local state only:', error.message);
            updateLocalState(dbPayload);
            alert('注意：由于数据库连接未配置或失败，数据仅在当前会话保存。');
        } else {
            // 3. Refetch to update UI
            await fetchCustomers();
        }
    } catch (e) {
        console.warn('DB Connection failed, updating local state only');
        updateLocalState(dbPayload);
        alert('注意：由于数据库连接未配置或失败，数据仅在当前会话保存。');
    }
  };

  // Fallback for local update if DB fails
  const updateLocalState = (payload: any) => {
      const newCustomer: Customer = {
          id: Math.random().toString(),
          company_name: payload.company_name,
          province: payload.province,
          city: payload.city,
          capacity_mw: payload.capacity_mw,
          demand_type: payload.demand_type,
          industry: payload.industry,
          contact: payload.contact_name,
          phone: payload.contact_phone
      };
      setCustomers(prev => [newCustomer, ...prev]);
  };

  return (
    // Root Container: Using min-h-screen and overflow-auto to allow scrolling
    <div className="min-h-screen tech-bg font-sans text-gray-200 flex flex-col relative overflow-auto">
      
      {/* Decorative Grid Overlay - Fixed position so it stays during scroll */}
      <div className="fixed inset-0 perspective-container pointer-events-none z-0 overflow-hidden">
        <div className="cyber-floor"></div>
        <div className="ambient-glow"></div>
      </div>
      
      <div className="fixed inset-0 pointer-events-none z-0 scanline"></div>

      {/* 
         Content Wrapper:
         Removed min-w-[1280px] to allow responsive resizing on mobile.
         Added padding adjustment for mobile vs desktop.
      */}
      <div className="flex flex-col flex-1 relative z-10 p-4 lg:p-6 min-h-screen">
        
        {/* Header */}
        <header className="relative py-4 text-center border-b border-cyan-500/20 bg-slate-900/60 shrink-0 backdrop-blur-sm shadow-[0_4px_20px_-5px_rgba(8,145,178,0.3)] mb-6">
          <h1 className="text-xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 tracking-[0.2em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase">
            虚拟电厂资源整合平台
          </h1>
          <div className="w-full h-[1px] mt-4 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
          <div className="w-32 h-[2px] mx-auto bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
        </header>

        {/* Main Layout Grid: Single column on mobile, 12 columns on desktop */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Demand Table + Resource Chart */}
          <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
            
            {/* Top Left: Regional Demand Stats */}
            <div className="flex flex-col h-[300px]">
              <div className="flex items-center gap-2 mb-2 shrink-0">
                <div className="w-2 h-2 bg-cyan-400 rotate-45 shadow-[0_0_5px_#22d3ee]"></div>
                <h2 className="text-lg font-bold text-cyan-100 tracking-wide text-shadow">各地需求量统计</h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <AutoScrollTable
                  data={regionStats}
                  height="h-full"
                  rowHeight={40}
                  minWidth="600px" // Ensure horizontal scroll on mobile
                  columns={[
                    { header: '城市', accessor: (d: RegionStat) => <span className="font-medium text-cyan-200">{d.city}</span>, className: 'flex-1' },
                    { header: '站点(个)', accessor: (d: RegionStat) => <span className="text-white">{d.site_count}</span>, className: 'flex-1' },
                    { header: '光伏(MW)', accessor: (d: RegionStat) => <span className="text-indigo-300">{d.pv_mw.toFixed(1)}</span>, className: 'flex-1' },
                    { header: '储能(MW)', accessor: (d: RegionStat) => <span className="text-green-300">{d.storage_mw.toFixed(1)}</span>, className: 'flex-1' },
                    { header: '充电(MW)', accessor: (d: RegionStat) => <span className="text-yellow-300">{d.ev_mw.toFixed(1)}</span>, className: 'flex-1' },
                    { header: '合计(MW)', accessor: (d: RegionStat) => <span className="font-bold text-cyan-400">{d.total_mw.toFixed(1)}</span>, className: 'flex-1' },
                  ]}
                />
              </div>
            </div>

            {/* Bottom Left: Resource Chart */}
            <div className="flex flex-col h-[300px]">
               <ResourceChart data={chartData} />
            </div>

          </div>

          {/* RIGHT COLUMN: Customer List */}
          <div className="col-span-1 lg:col-span-4 flex flex-col h-[500px] lg:h-[624px]">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <div className="w-2 h-2 bg-purple-400 rotate-45 shadow-[0_0_5px_#a855f7]"></div>
              <h2 className="text-lg font-bold text-cyan-100 tracking-wide">客户列表</h2>
            </div>
            <div className="flex-1 overflow-hidden"> 
              <AutoScrollTable
                data={customers}
                height="h-full"
                rowHeight={42}
                minWidth="1000px" // Always horizontal scroll on mobile for detailed view
                columns={[
                  { 
                    header: '企业名称', 
                    accessor: (d: Customer) => <span className="font-medium text-slate-200 truncate block hover:text-cyan-300 transition-colors" title={d.company_name}>{d.company_name}</span>, 
                    className: 'min-w-[180px] flex-1' 
                  },
                  { 
                    header: '省份', 
                    accessor: (d: Customer) => d.province, 
                    className: 'min-w-[60px] flex-1 text-slate-400' 
                  },
                  { 
                    header: '城市', 
                    accessor: (d: Customer) => d.city, 
                    className: 'min-w-[60px] flex-1 text-slate-400' 
                  },
                  { 
                    header: '容量(MW)', 
                    accessor: (d: Customer) => <span className="text-cyan-400 font-bold">{d.capacity_mw}</span>, 
                    className: 'min-w-[80px] flex-1' 
                  },
                  { 
                    header: '需求类型', 
                    accessor: (d: Customer) => (
                      <span className={`px-2 py-0.5 rounded-sm text-xs border whitespace-nowrap ${
                        d.demand_type.includes('光伏') 
                          ? 'bg-orange-500/10 text-orange-300 border-orange-500/30' 
                          : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                      }`}>
                        {d.demand_type}
                      </span>
                    ), 
                    className: 'min-w-[100px] flex-1' 
                  },
                  { 
                    header: '行业', 
                    accessor: (d: Customer) => <span className="text-slate-300">{d.industry}</span>, 
                    className: 'min-w-[100px] flex-1' 
                  },
                  { 
                    header: '联系人', 
                    accessor: (d: Customer) => maskName(d.contact), 
                    className: 'min-w-[80px] flex-1 text-slate-400' 
                  },
                  { 
                    header: '电话', 
                    accessor: (d: Customer) => maskPhone(d.phone), 
                    className: 'min-w-[120px] flex-1 text-slate-400 font-mono' 
                  },
                ]}
              />
            </div>
          </div>

        </main>

        {/* Bottom Section: Registration Trigger */}
        <div className="mt-8 pt-4 pb-12 text-center shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-3 px-16 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] transform transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] flex items-center justify-center mx-auto gap-3 text-lg border border-red-400/50"
          >
             <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-md animate-pulse" />
            <span className="text-2xl leading-none mb-1">+</span> 登记我的资源
          </button>
        </div>

      </div>

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