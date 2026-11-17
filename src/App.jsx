import { BrowserRouter } from 'react-router-dom';

import { ToastProvider } from './components/common/PremiumToast';
import WaterMotorOperations from './components/waterMonitor/WaterMotorOperations';
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
							<WaterMotorOperations>
								<AppRoutes />
							</WaterMotorOperations>
						</ToastProvider>
					</CommonDataContextProvider>
				</ApplicationProvider>
			</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
