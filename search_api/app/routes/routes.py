from flask import request, jsonify, render_template, send_from_directory

from search_api.api import db
from search_api.app.models import PaperStore, PaperSchema, ReadingList, ReadingListSchema
from search_api.app.routes import bp


class InvalidRequest(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv


@bp.errorhandler(InvalidRequest)
def handle_invalid_request(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/static/<path:path>')
def static_files(path):
    return send_from_directory('../search_app/build/static', path)



@bp.route('/api/v1/search', methods=['GET'])
def search_paper_metadata():  # put application's code here
    search_term = request.args.get('search_term')

    search_term = search_term.lower()

    if search_term is None:
        return jsonify([])

    # hard limit has been set in place to prevent broad queries from fetching entire database and slowing down the react app
    # pagination is a clear solution to this.Smaller pages=smaller data structures=no slowdown. Likely offset+limit pagination.
    # offset + limit pagination can lead to performance slow-downs server side
    # However performance hit from returning 40k records seems to occur largely within the transfer of data over the network and within the browser itself when loading + rendering data
    # So I'm not too concerned about server speed limits incurred from this pagination choice
    # Offset + limit pagination is also easy to implement so it wins as the choice of pagination approach

    # Where this production code. Pagination would be the next (and critial) API feature to add!!
    results = PaperStore.query.filter(PaperStore.title.like(f"%{search_term}%") |
                                      PaperStore.authors.like(f"%{search_term}%") |
                                      PaperStore.journal.like(f"%{search_term}%") |
                                      PaperStore.abstract.like(f"%{search_term}%")
                                      ).limit(5000).all()

    papers_schema = PaperSchema(many=True)

    return jsonify(papers_schema.dump(results))


@bp.route('/api/v1/reading_list', methods=['GET'])
def get_reading_list():
    reading_list = ReadingList.query.all()

    reading_list_schema = ReadingListSchema(many=True)

    return jsonify(reading_list_schema.dump(reading_list))


@bp.route('/api/v1/reading_list', methods=['POST'])
def add_item_to_reading_list():
    reading_list_item = request.get_json()

    if reading_list_item is None:
        raise InvalidRequest(message="Request Body Is Missing One Or More Required Keys")

    for key in ['title', 'paper_url']:
        if key not in reading_list_item.keys():
            raise InvalidRequest(message="Request Body Is Missing One Or More Required Keys")

    new_reading_list_item = ReadingList(title=reading_list_item['title'], paper_url=reading_list_item['paper_url'])
    db.session.add(new_reading_list_item)
    db.session.commit()

    reading_list_schema = ReadingListSchema()

    return jsonify(reading_list_schema.dump(new_reading_list_item))
