import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UtensilsCrossed, Star, ChevronLeft, CalendarClock, ShoppingBag } from 'lucide-react';
import { menuService } from '../../services/menu.service';
import { recommendationService } from '../../services/recommendation.service';
import { tableService } from '../../services/table.service'; // needed for getMyBookings
import type { MenuItem, Category } from '../../types/menu.types';
import type { TopPick } from '../../types/recommendation.types';
import type { BookingItem } from '../../types/table.types';

// Colour accent per category index (cycles)
const CAT_COLOURS = [
  'from-orange-500 to-red-500',
  'from-yellow-500 to-orange-500',
  'from-green-500 to-emerald-500',
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-violet-500',
  'from-pink-500 to-rose-500',
  'from-teal-500 to-green-500',
  'from-indigo-500 to-blue-500',
];
const CAT_BG = [
  'bg-orange-50 border-orange-200 text-orange-700',
  'bg-yellow-50 border-yellow-200 text-yellow-700',
  'bg-green-50 border-green-200 text-green-700',
  'bg-blue-50 border-blue-200 text-blue-700',
  'bg-purple-50 border-purple-200 text-purple-700',
  'bg-pink-50 border-pink-200 text-pink-700',
  'bg-teal-50 border-teal-200 text-teal-700',
  'bg-indigo-50 border-indigo-200 text-indigo-700',
];

export default function MenuPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [topPicks, setTopPicks] = useState<TopPick[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<MenuItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingItem[]>([]);
  const [preOrderError, setPreOrderError] = useState('');
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      menuService.getCategories(),
      menuService.getFullMenu(),
      recommendationService.getTopPicks().catch(() => []),
      tableService.getMyBookings(0, 5).catch(() => null),
    ]).then(([cats, items, picks, bookingsPage]) => {
      setCategories(cats as Category[]);
      setMenuItems(items as MenuItem[]);
      setTopPicks((picks ?? []) as TopPick[]);
      if ((cats as Category[]).length > 0) setActiveCategory((cats as Category[])[0].id);

      // Filter to upcoming confirmed/pending bookings (today or future)
      const today = new Date().toISOString().slice(0, 10);
      const page = bookingsPage as any;
      const upcoming: BookingItem[] = page?.content?.filter?.(
        (b: BookingItem) =>
          (b.status === 'PENDING' || b.status === 'CONFIRMED') &&
          b.bookingDate >= today
      ) ?? [];
      setUpcomingBookings(upcoming);
    }).finally(() => setLoading(false));
  }, []);

  const handlePreOrder = (booking: BookingItem) => {
    setPreOrderError('');
    const qrToken = booking.tableQrToken;
    if (!qrToken) {
      setPreOrderError('QR code not available for this table. Please contact staff.');
      return;
    }
    navigate(`/order?table=${qrToken}&preorder=1&booking=${booking.id}`);
  };

  const handleSearch = useCallback(async (keyword: string) => {
    setSearchKeyword(keyword);
    if (!keyword.trim()) { setSearchResults(null); return; }
    const results = await menuService.searchMenu(keyword);
    setSearchResults(results);
  }, []);

  const selectCategory = (id: number) => {
    setActiveCategory(id);
    setSearchKeyword('');
    setSearchResults(null);
  };

  const visibleItems = searchResults !== null
    ? searchResults
    : menuItems.filter(item => item.categoryId === activeCategory && item.isAvailable !== false);

  const activeCatIndex = categories.findIndex(c => c.id === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex-shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition flex-shrink-0"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <UtensilsCrossed size={16} className="text-white" />
            </div>
            <span className="text-gray-900 font-bold text-lg tracking-tight hidden sm:block">GrabEat Menu</span>
          </div>

          {/* Search */}
          <div className="flex-1 relative max-w-lg">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchKeyword}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* ── Category scroll (mobile only) ── */}
        <div className="lg:hidden flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {categories.map((cat, i) => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold border transition flex-shrink-0 ${
                activeCategory === cat.id
                  ? `bg-gradient-to-r ${CAT_COLOURS[i % CAT_COLOURS.length]} text-white border-transparent shadow`
                  : 'text-gray-600 bg-white border-gray-200 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Category Sidebar (desktop) ─────────────────────────────── */}
        <aside
          ref={sidebarRef}
          className="hidden lg:flex flex-col w-56 xl:w-64 flex-shrink-0 overflow-y-auto bg-white border-r border-gray-200"
          style={{ height: 'calc(100vh - 57px)', position: 'sticky', top: 57 }}
        >
          <div className="p-3 space-y-1">
            {categories.map((cat, i) => {
              const count = menuItems.filter(m => m.categoryId === cat.id).length;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(cat.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl transition-all group flex items-center justify-between gap-2 ${
                    isActive
                      ? `bg-gradient-to-r ${CAT_COLOURS[i % CAT_COLOURS.length]} shadow`
                      : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className={`font-semibold text-sm leading-tight ${isActive ? 'text-white' : ''}`}>{cat.name}</span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── RIGHT: Item Grid ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 57px)' }}>
          <div className="max-w-5xl mx-auto px-4 py-6">

            {/* Category header */}
            {!searchKeyword && activeCategory && (
              <div className="mb-6">
                <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r ${CAT_COLOURS[activeCatIndex % CAT_COLOURS.length]}`}>
                  <UtensilsCrossed size={20} className="text-white" />
                  <h2 className="text-white font-bold text-xl">
                    {categories.find(c => c.id === activeCategory)?.name}
                  </h2>
                  <span className="bg-white/25 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {visibleItems.length} items
                  </span>
                </div>
              </div>
            )}

            {searchKeyword && (
              <div className="mb-6">
                <h2 className="text-gray-900 font-bold text-xl">
                  Search results for <span className="text-orange-500">"{searchKeyword}"</span>
                  <span className="text-gray-400 text-base font-normal ml-2">— {visibleItems.length} found</span>
                </h2>
              </div>
            )}

            {/* ── Pre-order banner (shown when customer has upcoming bookings) ── */}
            {!searchKeyword && upcomingBookings.length > 0 && activeCatIndex === 0 && (
              <div className="mb-6 rounded-2xl overflow-hidden bg-orange-50 border border-orange-200">
                <div className="px-5 py-3 flex items-center gap-2 border-b border-orange-200">
                  <CalendarClock size={16} className="text-orange-500 flex-shrink-0" />
                  <p className="text-orange-700 font-semibold text-sm">Pre-order for your upcoming visit</p>
                </div>
                <div className="px-5 py-3 space-y-2">
                  {preOrderError && (
                    <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{preOrderError}</p>
                  )}
                  {upcomingBookings.map(booking => (
                    <div key={booking.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-gray-900 text-sm font-medium">
                          Table {booking.tableNumber}
                          <span className="text-gray-500 font-normal text-xs ml-2">
                            {booking.bookingDate} · {booking.startTime.slice(0, 5)} – {booking.endTime.slice(0, 5)} · {booking.partySize} {booking.partySize === 1 ? 'guest' : 'guests'}
                          </span>
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          Order now → food will be ready when you arrive
                        </p>
                      </div>
                      <button
                        onClick={() => handlePreOrder(booking)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition"
                      >
                        <ShoppingBag size={12} />
                        Order Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Picks (shown at top of first category) */}
            {!searchKeyword && topPicks.length > 0 && activeCatIndex === 0 && (
              <div className="mb-8 p-4 rounded-2xl bg-orange-50 border border-orange-200">
                <h3 className="text-sm font-bold text-orange-600 mb-3 flex items-center gap-1.5">
                  <Star size={14} className="fill-orange-500 text-orange-500" /> Popular This Week
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {topPicks.slice(0, 6).map(pick => (
                    <div key={pick.id} className="flex-shrink-0 w-28 rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm">
                      {pick.imageUrl ? (
                        <img src={pick.imageUrl} alt={pick.menuItemName} className="w-full h-20 object-cover" />
                      ) : (
                        <div className="w-full h-20 bg-orange-100 flex items-center justify-center">
                          <UtensilsCrossed size={18} className="text-orange-400" />
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{pick.menuItemName}</p>
                        <p className="text-xs font-bold text-orange-500 mt-0.5">NPR {pick.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Item Grid */}
            {visibleItems.length === 0 ? (
              <div className="text-center py-20">
                <UtensilsCrossed size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-400 text-base">No items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleItems.map((item, i) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl overflow-hidden flex flex-col group transition-all duration-200 hover:shadow-lg border border-gray-200"
                  >
                    {/* Image */}
                    <div className="relative w-full h-44 flex-shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${CAT_COLOURS[(activeCatIndex + i) % CAT_COLOURS.length]} opacity-20`}
                        >
                          <UtensilsCrossed size={40} className="text-white opacity-60" />
                        </div>
                      )}
                      {/* Badges overlay */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {item.isVegetarian && (
                          <span className="text-xs bg-green-500 text-white font-semibold px-2 py-0.5 rounded-full shadow">Veg</span>
                        )}
                        {item.isSpicy && (
                          <span className="text-xs bg-red-500 text-white font-semibold px-2 py-0.5 rounded-full shadow">Spicy</span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base leading-snug">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span className="text-orange-500 font-extrabold text-lg">NPR {item.price}</span>
                        {item.categoryName && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CAT_BG[activeCatIndex % CAT_BG.length]}`}>
                            {item.categoryName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom CTA */}
            <div className="mt-10 space-y-3">
              <div className="rounded-2xl p-5 text-center bg-orange-50 border border-orange-200">
                <p className="text-orange-700 font-semibold mb-1">Already at your table?</p>
                <p className="text-gray-500 text-sm mb-3">Scan the QR code on your table to order directly.</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <button
                    onClick={() => navigate('/tables/book')}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow"
                  >
                    Book a Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
