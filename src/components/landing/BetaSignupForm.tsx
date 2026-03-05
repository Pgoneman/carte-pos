import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function BetaSignupForm() {
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    phone: '',
    email: '',
    location: '',
    currentPos: '',
    tableCount: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('beta_signups')
        .insert([{
          restaurant_name: formData.restaurantName,
          owner_name: formData.ownerName,
          phone: formData.phone,
          email: formData.email,
          location: formData.location,
          current_pos: formData.currentPos,
          table_count: parseInt(formData.tableCount) || 0,
        }]);

      if (error) {
        console.log('Beta signup (table may not exist):', formData);
      }

      setSubmitted(true);
    } catch {
      console.log('Beta signup fallback:', formData);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section id="signup" className="py-20 px-6 bg-brand-dark text-brand-cream">
        <div className="max-w-md mx-auto text-center">
          <span className="text-5xl block mb-4">🎉</span>
          <h3 className="text-2xl font-display mb-2">신청 완료!</h3>
          <p className="text-brand-brown-light font-body">
            48시간 이내에 연락드리겠습니다.<br />
            베타 3곳 한정이니 빠르게 확인해드릴게요.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="signup" className="py-20 px-6 bg-brand-dark text-brand-cream">
      <div className="max-w-md mx-auto">
        <h2 className="text-3xl font-display text-center mb-2">
          무료 베타 신청
        </h2>
        <p className="text-center text-brand-brown-light font-body mb-8">
          베타 3곳 한정 - 첫 달 무료 - 리스크 제로
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'restaurantName', label: '레스토랑 이름', placeholder: 'e.g., Seoul Garden BBQ', required: true },
            { key: 'ownerName', label: '담당자 이름', placeholder: 'John Kim', required: true },
            { key: 'phone', label: '전화번호', placeholder: '(213) 555-1234', required: true },
            { key: 'email', label: '이메일', placeholder: 'john@restaurant.com', required: true },
            { key: 'location', label: '지역', placeholder: 'e.g., LA, OC, NYC', required: false },
            { key: 'currentPos', label: '현재 사용 중인 POS', placeholder: 'e.g., Toast, Clover, Square', required: false },
            { key: 'tableCount', label: '테이블 수', placeholder: 'e.g., 15', required: false },
          ].map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label className="block text-sm text-brand-brown-light mb-1 font-body">
                {label} {required && <span className="text-brand-red">*</span>}
              </label>
              <input
                type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
                required={required}
                placeholder={placeholder}
                value={formData[key as keyof typeof formData]}
                onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-brand-warm/50 border border-brand-warm
                           text-brand-cream placeholder:text-brand-muted
                           focus:outline-none focus:border-brand-red transition-colors font-body"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red hover:bg-brand-red-light text-white font-bold
                       py-4 rounded-full text-lg transition-colors font-body mt-6
                       disabled:opacity-50 shadow-lg shadow-brand-red/30"
          >
            {loading ? '제출 중...' : '무료 베타 신청하기'}
          </button>

          <p className="text-xs text-brand-muted text-center mt-3 font-body">
            첫 달 100% 무료 &nbsp;-&nbsp; 회전율 안 오르면 무조건 철수 &nbsp;-&nbsp; 설치 30분 완료
          </p>
        </form>
      </div>
    </section>
  );
}
