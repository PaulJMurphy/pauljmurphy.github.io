const header = document.querySelector('.top-nav');

if (header) {
  const toggleScrolledState = () => {
    document.body.classList.toggle('scrolled', window.scrollY > 16);
  };

  toggleScrolledState();
  window.addEventListener('scroll', toggleScrolledState, { passive: true });
}

const viewButtons = document.querySelectorAll('.view-btn');
const archiveList = document.querySelector('.archive-list');
const featuredPosts = document.querySelector('#featured-posts');
const archiveItems = document.querySelector('#archive-items');
const searchInput = document.querySelector('#search-input');
const topicFilter = document.querySelector('#topic-filter');
const yearFilter = document.querySelector('#year-filter');
let posts = [];

if (viewButtons.length && archiveList) {
  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      viewButtons.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      archiveList.setAttribute('data-view', button.dataset.view);
    });
  });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function renderPosts() {
  if (!featuredPosts || !archiveItems) {
    return;
  }

  const query = searchInput?.value.trim().toLowerCase() || '';
  const selectedTopic = topicFilter?.value || 'all';
  const selectedYear = yearFilter?.value || 'all';

  const filteredPosts = posts.filter((post) => {
    const matchesQuery =
      !query ||
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.topic.toLowerCase().includes(query);
    const matchesTopic = selectedTopic === 'all' || post.topic === selectedTopic;
    const matchesYear = selectedYear === 'all' || post.year === selectedYear;

    return matchesQuery && matchesTopic && matchesYear;
  });

  const featured = filteredPosts.filter((post) => post.featured);
  const archive = filteredPosts.filter((post) => !post.featured);

  if (featured.length) {
    featuredPosts.innerHTML = featured
      .map(
        (post) => `
          <article class="featured-card">
            <p class="archive-tag">Featured</p>
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
            <div class="archive-meta">
              <span>${formatDate(post.date)}</span>
              <span>${post.readingTime}</span>
            </div>
          </article>
        `,
      )
      .join('');
  } else {
    featuredPosts.innerHTML = '<p class="empty-state">No featured posts match your filters.</p>';
  }

  if (archive.length) {
    archiveItems.innerHTML = archive
      .map(
        (post) => `
          <article class="archive-item">
            <div class="archive-meta">
              <span class="archive-tag">${post.topic}</span>
              <span>${formatDate(post.date)}</span>
            </div>
            <h2>${post.title}</h2>
            <p>${post.excerpt}</p>
            <a href="#" class="text-link">Read more</a>
          </article>
        `,
      )
      .join('');
  } else {
    archiveItems.innerHTML = '<p class="empty-state">No posts match your filters yet.</p>';
  }
}

async function loadPosts() {
  try {
    const response = await fetch('content/posts.json');
    if (!response.ok) {
      throw new Error('Unable to load posts');
    }
    posts = await response.json();
    renderPosts();
  } catch (error) {
    if (featuredPosts) {
      featuredPosts.innerHTML = '<p class="empty-state">The archive is temporarily unavailable.</p>';
    }
    if (archiveItems) {
      archiveItems.innerHTML = '<p class="empty-state">Please refresh the page to try again.</p>';
    }
  }
}

if (searchInput) {
  searchInput.addEventListener('input', renderPosts);
}

if (topicFilter) {
  topicFilter.addEventListener('change', renderPosts);
}

if (yearFilter) {
  yearFilter.addEventListener('change', renderPosts);
}

if (featuredPosts && archiveItems) {
  loadPosts();
}
