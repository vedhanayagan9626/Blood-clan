from flask import Blueprint, render_template, request
from app.models import BloodRequest

bp = Blueprint("main", __name__)

@bp.route("/")
def home():
    return render_template("home.html")

@bp.route("/requests")
def request_list():
    page = request.args.get('page', 1, type=int)
    requests = BloodRequest.query.filter_by(is_open=True).paginate(
        page=page, per_page=10, error_out=False
    )
    return render_template("request_list.html", requests=requests)

@bp.route("/requests/<int:req_id>")
def request_detail(req_id):
    req = BloodRequest.query.get_or_404(req_id)
    return render_template("request_detail.html", request=req)

@bp.route("/create")
def create_request():
    return render_template("create_request.html")