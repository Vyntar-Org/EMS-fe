import { BrowserRouter } from 'react-router-dom';

import { ToastProvider } from './components/common/PremiumToast';
import OHTMotorOperations from './components/OHT/OHTMotorOperations';
import { ApplicationProvider } from './contexts/ApplicationContext';
import { AuthProvider } from './contexts/AuthContext';
import { CommonDataContextProvider } from './contexts/CommonDataContext';
import { AppRoutes } from './routes/AppRoutes';

function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<ApplicationProvider>
					<CommonDataContextProvider>
						<ToastProvider>
							<OHTMotorOperations>
								<AppRoutes />
							</OHTMotorOperations>
						</ToastProvider>
					</CommonDataContextProvider>
				</ApplicationProvider>
			</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
