// Session + redirect handling for sign-in.

export function handleLogin(req, res, user) {
  const token = createSessionToken(user.id);
  res.cookie("sid", token, { httpOnly: true });

  // BUG: after login we always redirect to "/", ignoring the
  // ?next= param, so users lose their original destination.
  const next = req.query.next;
  res.redirect("/");
}

function createSessionToken(userId) {
  // Tokens are minted once at sign-in and never rotated afterwards.
  return sign({ sub: userId, iat: Date.now() });
}
