# Quick Test Guide - InteractJob Improvements

## 🧪 How to Verify the Changes

### 1. Test Mobile Filters & Sorting

**On Mobile (or resize browser to < 768px width):**

1. Go to: `https://www.interactjob.ma/offres` (or `http://localhost:3000/offres`)
2. Look for the **"Filtrer" button** (should appear above job cards)
3. Click it → filters panel should slide in/out
4. Click again → filters panel should hide

**Test Sort Dropdown:**
1. Next to "Filtrer" button, see the **"Sort" dropdown**
2. Change from "Offres récentes" to "Offres anciennes"
3. Job list should reorder (oldest posts first)
4. Change to "Offres sponsorisées"
5. Sponsored offers should appear at top

**Test Filters on Mobile:**
1. Click "Filtrer" to show filters
2. Select a city → results should filter
3. Select a sector → results should filter further
4. Use keyword search → results update in real-time
5. Click "Réinitialiser" → all filters reset

---

### 2. Test Desktop Filters & Sorting

**On Desktop (browser width > 768px):**

1. Filters panel should be **always visible** on left
2. Above job cards, see the **sort bar**: "125 Offres trouvées | Trier par: [Dropdown]"
3. Use sort dropdown (same options as mobile)
4. All filters on left sidebar should work normally
5. "Filtrer" button from mobile should be **hidden**

---

### 3. Test LinkedIn Article Prevention

**Check the Published Posts File:**

1. Open: `C:\Users\Adil\interactjob\data\published-posts.json`
2. You should see entries like:
   ```json
   {
     "2026-05-24|article|article-slug": {
       "date": "2026-05-24",
       "label": "ARTICLE BLOG",
       "articleSlug": "article-slug",
       "postId": "...",
       "publishedAt": "2026-05-24T21:00:00Z"
     }
   }
   ```

**Monitor the Agent Logs:**

1. Check PM2 logs: `pm2 logs interactjob-agent`
2. Look for messages like:
   - "LinkedIn blog: aucun article trouvé" (if no articles)
   - "LinkedIn blog: tous les articles ont été postés aujourd'hui" (fallback message)
   - "LinkedIn nuit: ✨ post 21h publié" (article published)

**Daily Article Verification:**

- **May 25 at 19:00:** Article A posted (from queue generated at 08:00)
- **May 25 at 21:00:** Article B posted (fresh generation, skips A)
- **May 26 at 08:00:** Queue generation skips A & B → selects Article C
- **May 26 at 19:00:** Article C posted
- **May 26 at 21:00:** Article D posted (skips A, B, C)

---

### 4. Test Multilingual Support

**Switch to Arabic:**
1. On the job offers page, change language to Arabic
2. Check that:
   - Filters have RTL layout ✓
   - "Trier par:" appears as "ترتيب:" ✓
   - Sort options show in Arabic:
     - "الأحدث" (newest)
     - "الأقدم" (oldest)
     - "العروض المميزة" (sponsored)

---

## ✅ Expected Behavior Checklist

### Mobile (< 768px):
- [ ] "Filtrer" button visible
- [ ] Sort dropdown visible
- [ ] Click "Filtrer" → filters panel appears
- [ ] Click "Filtrer" again → filters panel disappears
- [ ] Sort dropdown changes job order
- [ ] All filters work (city, sector, keyword, contract, source)
- [ ] "Reset filters" button works

### Desktop (≥ 768px):
- [ ] Filters always visible on left sidebar
- [ ] "Filtrer" button is hidden
- [ ] Sort bar visible above job cards
- [ ] Sort dropdown shows all 3 options
- [ ] Result count displays correctly
- [ ] All filters work normally
- [ ] Sticky sidebar works on scroll

### LinkedIn Article Posts:
- [ ] `published-posts.json` file created and updated
- [ ] Articles tracked with date and slug
- [ ] Agent logs show article selection
- [ ] Different articles posted at 19:00 and 21:00
- [ ] Next day uses different articles
- [ ] Fallback works if all articles exhausted

### General:
- [ ] No console errors in browser
- [ ] Page loads within 2-3 seconds
- [ ] Responsive transitions work smoothly
- [ ] RTL/LTR text direction correct
- [ ] French and Arabic labels display correctly

---

## 🐛 Troubleshooting

**Filters not showing on mobile:**
- Clear browser cache (Ctrl+Shift+Delete)
- Ensure viewport is actually < 768px
- Check browser console for JavaScript errors

**Sort not working:**
- Refresh page (Ctrl+R)
- Check that job data loads correctly
- Verify `postedAt` field exists on all jobs

**Articles not tracking:**
- Check `data/published-posts.json` exists and is writable
- Check agent logs for errors: `pm2 logs interactjob-agent`
- Verify articles.json has data: `wc -l data/articles.json`

**Mobile toolbar overlapping content:**
- This is expected on very small screens
- Should reflow when you scroll
- If persistent, check CSS media queries

---

## 📱 Responsive Breakpoints

- **Mobile:** 0 - 767px (filters hidden, mobile toolbar visible)
- **Tablet:** 768px - 1023px (filters visible, sort bar visible)
- **Desktop:** 1024px+ (full layout, all features visible)

---

## 🚀 How to Deploy

1. **No environment variables needed** - all changes are self-contained
2. **No database migrations needed** - uses existing data structure
3. **No npm install needed** - no new dependencies
4. **Just deploy the code** - run `git push` and Vercel rebuilds automatically

---

**Last Updated:** May 24, 2026
**Build Status:** ✅ Verified
**Ready to Test:** ✅ Yes
