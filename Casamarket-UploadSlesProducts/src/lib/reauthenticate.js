export async function reauthenticateWithAcl(authData, password) {
  const res = await fetch('https://acl.casamarketapp.com/api/authenticate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      accept: 'application/json, text/plain, */*',
    },
    body: JSON.stringify({
      email: authData?.loginEmail || authData?.email,
      password,
      codeApp: 'quipuadmin',
    }),
  })

  return res
}