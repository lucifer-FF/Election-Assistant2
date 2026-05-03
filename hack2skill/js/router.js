import { store } from './store.js';
import { HomeView } from './views/home.js';
import { DashboardView } from './views/dashboard.js';
import { AdminView } from './views/admin.js';
import { CandidatesView } from './views/candidates.js';
import { NewsView } from './views/news.js';

const routes = {
    '/': HomeView,
    '/dashboard': DashboardView,
    '/admin': AdminView,
    '/candidates': CandidatesView,
    '/news': NewsView
};

export const router = {
    init() {
        window.addEventListener('hashchange', this.handleRoute.bind(this));
        this.handleRoute();
    },

    async handleRoute() {
        let path = window.location.hash.slice(1) || '/';
        
        // Handle anchor links on home page (e.g., #timeline)
        if (path !== '/' && !path.startsWith('/') && !routes['/' + path]) {
            path = '/';
        }

        if (!path.startsWith('/')) {
            path = '/' + path;
        }

        const view = routes[path] || HomeView;

        // Route Guards
        if (path === '/admin') {
            if (!store.state.currentUser || store.state.currentUser.role !== 'admin') {
                window.location.hash = '/'; // Redirect to home if not admin
                return;
            }
        }
        if (path === '/dashboard') {
            if (!store.state.currentUser) {
                // Not logged in, could show login modal. For now redirect home.
                window.location.hash = '/';
                return;
            }
        }

        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            // Unmount previous view if necessary
            if (this.currentView && this.currentView.unmount) {
                this.currentView.unmount();
            }

            // Render new view
            appContainer.innerHTML = view.render();
            
            // Mount new view (attach event listeners, etc)
            if (view.mount) {
                await view.mount();
            }

            this.currentView = view;
            window.scrollTo(0, 0);
        }
    }
};
