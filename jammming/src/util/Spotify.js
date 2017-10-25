let Spotify = {};
let userAccessToken;
let clientId = "952c3b2049d4443dba916e475b85e81c";
let redirectUrl = "http://localhost:3000/";

Spotify.getAccessToken = () => {
  if (userAccessToken)
    return userAccessToken;

  let accessToken = window.location.href.match(/access_token=([^&]*)/);
  let expiresIn = window.location.href.match(/expires_in=([^&]*)/);
  if (accessToken && expiresIn) {
    userAccessToken = accessToken[1];
    window.setTimeout(() => accessToken = '', expiresIn[1] * 1000);
    window.history.pushState('Access Token', null, '/');
    return userAccessToken;
  }
  else {
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUrl}`;
  }
}

Spotify.search = (searchTerm) => {
  return fetch(`https://api.spotify.com/v1/search?type=track&q=${searchTerm}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${Spotify.getAccessToken()}`
    }
  }).then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Request to Spotify/search failed!');
  }, networkError => console.log(networkError.message)
  ).then(jsonResponse => {
    if (jsonResponse.tracks.items.length === 0)
      return [];

    return jsonResponse.tracks.items.map(track => {
      return {
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        uri: track.uri,
      }
    });
  });
}

Spotify.savePlaylist = (playlistName, trackURIs) => {
  if (!playlistName || !trackURIs)
    return;

  let userId;
  let playlistId;
  let headers = {
    Authorization: `Bearer ${Spotify.getAccessToken()}`
  }

  // Fetch UserId
  return fetch(`https://api.spotify.com/v1/me`, {
    method: 'GET',
    headers: headers
  }).then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Request to Spotify/me failed!');
  }, networkError => console.log(networkError.message)
  ).then(jsonResponse => {
    userId = jsonResponse.id;
  })
  // Create new Playlist
  .then(() => {
    fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        name: playlistName
      })
    }).then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Request to Spotify/playlists failed!');
    }, networkError => console.log(networkError.message)
    ).then(jsonResponse => {
      playlistId = jsonResponse.id;
    })
    // Add Tracks to Playlist
    .then(() => {
      fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          uris: trackURIs
        })
      }).then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Request to Spotify/tracks failed!');
      }, networkError => console.log(networkError.message)
      );
    });
  });
};

export default Spotify;
