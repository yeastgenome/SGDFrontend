vcl 4.0;

import vsthrottle;

acl purgers {
    "127.0.0.1";
    "172.16.0.0/12";
}

acl curate_servers {
    "curate1.dev.yeastgenome.org";
    "curate1.qa.yeastgenome.org";
    "curate-2a.staging.yeastgenome.org";
    "curate-2a.yeastgenome.org";
}

backend default {
    .host = "127.0.0.1";
    .port = "8080";
    .connect_timeout = 300s;
    .first_byte_timeout = 300s;
}

sub vcl_recv {
    # pass POSTs so varnish doesn't transform into GET
    if (req.method == "POST") {
        return (pass);
    }

    # only allow addresses within our VPC to execute PURGE method
    if (req.method == "PURGE") {
        if (!client.ip ~ purgers) {
            return (synth(405));
        }
        return (purge);
    }

    # clients limited to 100 requests per 10 second interval
    # curate servers (which run cache refresh cron job) exempted
    if ((client.ip !~ curate_servers) &&
        vsthrottle.is_denied(client.identity, 100, 10s)) {
            return (synth(429, "Too Many Requests"));
    }

    unset req.http.Cookie;

    # normalize host names to prevent duplicate caching of same object
    if (req.http.host == "dev.yeastgenome.org") {
        set req.http.host = "www.dev.yeastgenome.org";
    }

    if (req.http.host == "qa.yeastgenome.org") {
        set req.http.host = "www.qa.yeastgenome.org";
    }

    if (req.http.host == "staging.yeastgenome.org") {
        set req.http.host = "www.staging.yeastgenome.org";
    }

    if (req.http.host == "yeastgenome.org") {
        set req.http.host = "www.yeastgenome.org";
    }

    # don't cache healthcheck
    if (req.url ~ "healthcheck$") {
        return (pass);
    }
}

sub vcl_backend_response {
    if (beresp.status != 200) {
        set beresp.ttl = 15s;
        return (deliver);
    }

    # set cache time values depending on environment
    if (bereq.http.host == "www.dev.yeastgenome.org") {
        set beresp.ttl = 30s;
        set beresp.grace = 30s;
    }

    if (bereq.http.host == "www.qa.yeastgenome.org") {
        set beresp.ttl = 30s;
        set beresp.grace = 30s;
    }

    if (bereq.http.host == "www.staging.yeastgenome.org") {
        set beresp.ttl = 23.75h;
        set beresp.grace = 30s;
    }

    if (bereq.http.host == "www.yeastgenome.org") {
        set beresp.ttl = 23.75h;
        set beresp.grace = 30s;
    }

    unset beresp.http.Server;
    unset beresp.http.Vary;
}

sub vcl_deliver {
    unset resp.http.Server;
    unset resp.http.Via;
    unset resp.http.X-Varnish;
}

sub vcl_purge {
    set req.method = "GET";
    return (restart);
}
