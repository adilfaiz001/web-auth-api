function generateEmailQueryURL(query) {
  return (
    `email=${query.email}&` +
    `verify=true`
  );
}
