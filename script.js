const storageKey = 'paulmurphy-cms-data';

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

function getPostHref(post) {
  const slug = post.slug || post.id;
  return `post.html?slug=${encodeURIComponent(slug)}`;
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
            <a href="${getPostHref(post)}" class="text-link">Read more</a>
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
    const storedPayload = localStorage.getItem(storageKey);
    if (storedPayload) {
      const parsed = JSON.parse(storedPayload);
      if (parsed.posts?.length) {
        posts = parsed.posts;
        renderPosts();
        return;
      }
    }

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

const postDetail = document.getElementById('post-detail');

if (postDetail) {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  async function loadPostDetail() {
    try {
      const storedPayload = localStorage.getItem(storageKey);
      let entries = [];

      if (storedPayload) {
        const parsed = JSON.parse(storedPayload);
        entries = [...(parsed.posts || []), ...(parsed.pages || [])];
      }

      if (!entries.length) {
        const response = await fetch('content/posts.json');
        if (!response.ok) {
          throw new Error('Unable to load post');
        }
        entries = await response.json();
      }

      const post = entries.find((entry) => (entry.slug || entry.id) === slug);
      if (!post) {
        throw new Error('Post not found');
      }

      document.title = `${post.title} | Paul Murphy`;
      postDetail.innerHTML = `
        <p class="archive-tag">Post</p>
        <h1>${post.title}</h1>
        <div class="archive-meta">
          <span>${formatDate(post.date)}</span>
          <span>${post.readingTime || '5 min read'}</span>
        </div>
        <p>${post.excerpt}</p>
        <div class="post-body">${post.content || '<p>Content will appear here.</p>'}</div>
      `;
    } catch (error) {
      postDetail.innerHTML = '<p class="empty-state">This post could not be loaded.</p>';
    }
  }

  loadPostDetail();
}

const editorRoot = document.querySelector('[data-editor-root]');

if (editorRoot) {
  const entryList = document.getElementById('entry-list');
  const newPageButton = document.getElementById('new-page');
  const newPostButton = document.getElementById('new-post');
  const exportButton = document.getElementById('export-data');
  const titleInput = document.getElementById('entry-title');
  const slugInput = document.getElementById('entry-slug');
  const typeSelect = document.getElementById('entry-type');
  const dateInput = document.getElementById('entry-date');
  const topicInput = document.getElementById('entry-topic');
  const featuredCheckbox = document.getElementById('entry-featured');
  const excerptInput = document.getElementById('entry-excerpt');
  const editorContent = document.getElementById('editor-content');
  const saveButton = document.getElementById('save-entry');
  const deleteButton = document.getElementById('delete-entry');
  const editorStatus = document.getElementById('editor-status');
  const previewFrame = document.getElementById('preview-frame');
  const toolbarButtons = document.querySelectorAll('.editor-toolbar button');

  let entries = [];
  let selectedEntryId = null;

  function slugify(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function setStatus(message, tone = 'info') {
    if (!editorStatus) {
      return;
    }

    editorStatus.textContent = message;
    editorStatus.dataset.tone = tone;
  }

  function getDefaultEntries() {
    const today = new Date().toISOString().slice(0, 10);
    return {
      pages: [
        {
          id: 'home',
          type: 'page',
          title: 'Home',
          slug: '/',
          excerpt: 'Welcome to Paul Murphy\'s writing space.',
          content: '<h2>Stories, thinking, and work in progress.</h2><p>This space is a personal showcase for essays, observations and projects that matter to me.</p>',
          date: today,
          featured: false,
        },
      ],
      posts: [],
    };
  }

  async function loadEditorData() {
    try {
      const storedPayload = localStorage.getItem(storageKey);
      if (storedPayload) {
        const parsed = JSON.parse(storedPayload);
        if (parsed.pages || parsed.posts) {
          return {
            pages: Array.isArray(parsed.pages) ? parsed.pages : [],
            posts: Array.isArray(parsed.posts) ? parsed.posts : [],
          };
        }
      }

      const [pagesResponse, postsResponse] = await Promise.all([
        fetch('content/pages.json'),
        fetch('content/posts.json'),
      ]);

      const pagesData = pagesResponse.ok ? await pagesResponse.json() : [];
      const postsData = postsResponse.ok ? await postsResponse.json() : [];

      return {
        pages: Array.isArray(pagesData) ? pagesData : [],
        posts: Array.isArray(postsData) ? postsData.map((post) => ({ ...post, type: 'post' })) : [],
      };
    } catch (error) {
      return getDefaultEntries();
    }
  }

  function persistEditorData() {
    const payload = {
      pages: entries.filter((entry) => entry.type === 'page'),
      posts: entries.filter((entry) => entry.type === 'post'),
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));
    if (posts.length === 0) {
      posts = payload.posts;
    }
  }

  function renderEntryList() {
    if (!entryList) {
      return;
    }

    const pages = entries.filter((entry) => entry.type === 'page');
    const posts = entries.filter((entry) => entry.type === 'post');

    const renderGroup = (label, items) => {
      if (!items.length) {
        return '';
      }

      return `
        <h3>${label}</h3>
        <div class="entry-group">
          ${items
            .map(
              (entry) => `
                <button
                  type="button"
                  class="entry-card ${entry.id === selectedEntryId ? 'active' : ''}"
                  data-entry-id="${entry.id}"
                >
                  <strong>${entry.title || 'Untitled'}</strong>
                  <span>${entry.slug || 'No slug'}</span>
                </button>
              `,
            )
            .join('')}
        </div>
      `;
    };

    entryList.innerHTML = `${renderGroup('Pages', pages)}${renderGroup('Posts', posts)}`;
    entryList.querySelectorAll('.entry-card').forEach((button) => {
      button.addEventListener('click', () => {
        selectEntry(button.dataset.entryId);
      });
    });
  }

  function createPreviewMarkup(entry) {
    if (!entry) {
      return '<p class="empty-state">Choose an item to preview it here.</p>';
    }

    return `
      <article class="preview-article">
        <p class="archive-tag">${entry.type === 'page' ? 'Page' : 'Post'}</p>
        <h2>${entry.title || 'Untitled'}</h2>
        <p>${entry.excerpt || 'A short excerpt will appear here.'}</p>
        <div class="preview-content">${entry.content || '<p>Start writing...</p>'}</div>
      </article>
    `;
  }

  function renderPreview() {
    if (!previewFrame) {
      return;
    }

    const currentEntry = entries.find((entry) => entry.id === selectedEntryId);
    previewFrame.innerHTML = createPreviewMarkup(currentEntry);
  }

  function populateForm(entry) {
    if (!entry) {
      return;
    }

    titleInput.value = entry.title || '';
    slugInput.value = entry.slug || '';
    typeSelect.value = entry.type || 'page';
    dateInput.value = entry.date || '';
    topicInput.value = entry.topic || '';
    featuredCheckbox.checked = Boolean(entry.featured);
    excerptInput.value = entry.excerpt || '';
    editorContent.innerHTML = entry.content || '<p>Start writing...</p>';
    renderPreview();
  }

  function selectEntry(entryId) {
    selectedEntryId = entryId;
    renderEntryList();
    const currentEntry = entries.find((entry) => entry.id === entryId);
    if (currentEntry) {
      populateForm(currentEntry);
      setStatus(`Editing ${currentEntry.title || 'untitled item'}.`);
    }
  }

  function createEntry(type) {
    const now = new Date().toISOString().slice(0, 10);
    const entry = {
      id: `${type}-${Date.now()}`,
      type,
      title: type === 'page' ? 'New page' : 'New post',
      slug: '',
      excerpt: '',
      content: '<p>Start writing your content here.</p>',
      date: now,
      year: now.slice(0, 4),
      featured: false,
      topic: 'Culture',
      readingTime: '5 min read',
    };

    entries.unshift(entry);
    selectedEntryId = entry.id;
    persistEditorData();
    renderEntryList();
    populateForm(entry);
    setStatus(`Created a new ${type}.`);
  }

  function syncCurrentEntry() {
    if (!selectedEntryId) {
      return;
    }

    const currentEntry = entries.find((entry) => entry.id === selectedEntryId);
    if (!currentEntry) {
      return;
    }

    currentEntry.title = titleInput.value || 'Untitled';
    currentEntry.slug = slugInput.value || slugify(titleInput.value);
    currentEntry.type = typeSelect.value;
    currentEntry.date = dateInput.value || currentEntry.date;
    currentEntry.year = (currentEntry.date || '').slice(0, 4);
    currentEntry.topic = topicInput.value || 'Culture';
    currentEntry.featured = featuredCheckbox.checked;
    currentEntry.excerpt = excerptInput.value;
    currentEntry.content = editorContent.innerHTML;
    currentEntry.readingTime = currentEntry.readingTime || '5 min read';
    persistEditorData();
    renderEntryList();
    renderPreview();
  }

  function saveEntry() {
    syncCurrentEntry();
    const currentEntry = entries.find((entry) => entry.id === selectedEntryId);
    if (currentEntry) {
      setStatus(`Saved ${currentEntry.title || 'untitled item'} locally.`);
      if (currentEntry.type === 'post') {
        posts = entries.filter((entry) => entry.type === 'post');
      }
      renderPosts();
    }
  }

  function deleteEntry() {
    if (!selectedEntryId) {
      return;
    }

    entries = entries.filter((entry) => entry.id !== selectedEntryId);
    selectedEntryId = entries[0]?.id || null;
    persistEditorData();
    renderEntryList();
    if (selectedEntryId) {
      populateForm(entries.find((entry) => entry.id === selectedEntryId));
      setStatus('Deleted the current item.');
    } else {
      previewFrame.innerHTML = '<p class="empty-state">Create a new page or post to get started.</p>';
      setStatus('No entries left. Create one to get started.');
    }
    renderPosts();
  }

  function exportData() {
    const payload = {
      pages: entries.filter((entry) => entry.type === 'page'),
      posts: entries.filter((entry) => entry.type === 'post'),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'site-content.json';
    link.click();
    URL.revokeObjectURL(url);
    setStatus('Exported a JSON file for your content.');
  }

  titleInput.addEventListener('input', syncCurrentEntry);
  slugInput.addEventListener('input', syncCurrentEntry);
  typeSelect.addEventListener('change', syncCurrentEntry);
  dateInput.addEventListener('change', syncCurrentEntry);
  topicInput.addEventListener('input', syncCurrentEntry);
  featuredCheckbox.addEventListener('change', syncCurrentEntry);
  excerptInput.addEventListener('input', syncCurrentEntry);
  editorContent.addEventListener('input', syncCurrentEntry);
  saveButton.addEventListener('click', saveEntry);
  deleteButton.addEventListener('click', deleteEntry);
  exportButton.addEventListener('click', exportData);
  newPageButton.addEventListener('click', () => createEntry('page'));
  newPostButton.addEventListener('click', () => createEntry('post'));

  toolbarButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const command = button.dataset.command;
      const value = button.dataset.value || null;

      if (command === 'createLink') {
        const url = window.prompt('Enter a link URL', 'https://');
        if (url) {
          document.execCommand('createLink', false, url);
        }
      } else {
        document.execCommand(command, false, value);
      }

      editorContent.focus();
      syncCurrentEntry();
    });
  });

  loadEditorData().then((data) => {
    entries = [...(data.pages || []), ...(data.posts || [])];
    if (!entries.length) {
      entries = [...getDefaultEntries().pages, ...getDefaultEntries().posts];
    }

    selectedEntryId = entries[0]?.id || null;
    persistEditorData();
    renderEntryList();
    if (selectedEntryId) {
      populateForm(entries.find((entry) => entry.id === selectedEntryId));
      setStatus('Loaded your saved content.');
    }
  });
}
