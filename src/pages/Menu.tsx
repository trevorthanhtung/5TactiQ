import { Link } from 'react-router-dom';
import { BarChart3, Briefcase, ChevronRight } from 'lucide-react';

export default function Menu() {
  const menuItems = [
    { icon: <BarChart3 className="text-primary" size={24} />, title: 'Thống kê & Nhập liệu', path: '/stats', desc: 'Bảng xếp hạng, điểm danh, kiến tạo' },
    { icon: <Briefcase className="text-secondary" size={24} />, title: 'Vận hành đội bóng', path: '/operations', desc: 'Quỹ đội, sân bãi, áo đấu' },
  ];

  return (
    <div className="p-4 flex flex-col min-h-full max-w-2xl mx-auto w-full">
      <h1 className="text-4xl @sm:text-5xl font-display uppercase text-primary leading-none mb-6 pt-2">Menu mở rộng</h1>
      
      <div className="space-y-4">
        {menuItems.map((item, index) => (
          <Link 
            key={index} 
            to={item.path}
            className="hallmark-card flex items-center p-4 hover:border-secondary transition-colors group"
          >
            <div className="w-12 h-12 border-2 border-border-main flex items-center justify-center mr-4 shrink-0 bg-accent/20 group-hover:border-secondary/50 transition-colors">
              {item.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-display uppercase text-xl leading-tight text-primary group-hover:text-secondary transition-colors">{item.title}</h3>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-secondary transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
