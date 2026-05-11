"""
Render docs/architecture.png from this script.

Usage (one-off):
    brew install graphviz
    python3 -m venv /tmp/diagrams-venv && /tmp/diagrams-venv/bin/pip install diagrams
    /tmp/diagrams-venv/bin/python docs/architecture.py
"""

from diagrams import Cluster, Diagram, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb
from diagrams.aws.management import Cloudformation
from diagrams.aws.mobile import Amplify
from diagrams.aws.network import APIGateway, CloudFront, Route53
from diagrams.aws.security import ACM
from diagrams.aws.storage import S3
from diagrams.onprem.client import User
from diagrams.onprem.vcs import Github

graph_attr = {
    "splines": "spline",
    "pad": "0.6",
    "fontname": "Helvetica",
    "fontsize": "12",
    "labelloc": "t",
}
edge_attr = {"fontname": "Helvetica", "fontsize": "10"}
node_attr = {"fontname": "Helvetica", "fontsize": "11"}

with Diagram(
    "StillHere4U · Waitlist Architecture (us-east-1)",
    filename="docs/architecture",
    show=False,
    direction="LR",
    outformat="png",
    graph_attr=graph_attr,
    edge_attr=edge_attr,
    node_attr=node_attr,
):
    visitor = User("Visitor")
    admin = User("Admin")

    with Cluster("DNS + TLS"):
        r53 = Route53("Route 53\nstillhere4u.com")
        acm = ACM("ACM cert")

    with Cluster("Amplify Hosting"):
        cf = CloudFront("CloudFront")
        s3 = S3("Managed S3\n(static assets)")
        amplify = Amplify("App d2dftcxv2ftgc2\nbranch: main")

    with Cluster("API Gateway"):
        api = APIGateway("HTTP API v2\nCORS pinned to apex")

    with Cluster("Lambda (Node 20 / arm64)"):
        fn_count = Lambda("count\n(public)")
        fn_post = Lambda("post\n(public)")
        fn_stats = Lambda("stats\nx-admin-token")

    with Cluster("Data"):
        db = Dynamodb("stillhere-waitlist\nPK: email\n+ '__counter__' sentinel")

    with Cluster("Build pipeline"):
        gh = Github("awswebdev-\nstillhere4u")

    with Cluster("Infra-as-code"):
        cfn = Cloudformation("SAM stack\nstillhere4u-waitlist")

    # --- Runtime: page load ---
    visitor >> Edge(label="HTTPS") >> r53 >> cf
    cf - Edge(style="dotted", color="gray") - acm
    cf >> s3

    # --- Runtime: API calls ---
    visitor >> Edge(label="GET /count\nPOST /waitlist", color="darkgreen") >> api
    admin >> Edge(label="GET /stats", color="darkorange") >> api

    api >> fn_count
    api >> fn_post
    api >> fn_stats

    fn_count >> Edge(label="Get sentinel") >> db
    fn_post >> Edge(label="CondPut + ADD") >> db
    fn_stats >> Edge(label="Scan") >> db

    # --- Build pipeline ---
    gh >> Edge(label="webhook on push", style="dashed", color="steelblue") >> amplify
    amplify >> Edge(style="dashed", color="steelblue") >> s3

    # --- Infra provisioning ---
    cfn >> Edge(style="dashed", color="gray") >> api
    cfn >> Edge(style="dashed", color="gray") >> fn_post
    cfn >> Edge(style="dashed", color="gray") >> db
