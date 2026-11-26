// AuthContext stores the whole /auth/me payload as `user` (login returns only
// tokens, so the profile comes from /auth/me), which puts the account fields
// one level down: `user.user.role`. A flat `user.role` is accepted too in case
// login ever starts returning the profile directly.
export const getUserRole = (user) => {
	const role = user?.user?.role ?? user?.role;
	return typeof role === 'string' ? role.toUpperCase() : null;
};

export const isAdminUser = (user) => getUserRole(user) === 'ADMIN';
