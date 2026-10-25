import "./ImageSection.css";

export default function ImageSection() {
  return (
    <section className="image-section">
      <h2 className="image-heading">Heading</h2>
      <p className="image-subheading">Subheading</p>

      <div className="image-list">

        {/* Item 1 */}
        <div className="image-item">
          <div className="image-placeholder"></div>

          <div className="image-text">
            <h3 className="item-title">Title</h3>
            <p className="item-body">
              Body text for whatever you'd like to say. Add main takeaway points,
              quotes, anecdotes, or even a very very short story.
            </p>
            <button className="item-button">Button</button>
          </div>
        </div>

        {/* Item 2 */}
        <div className="image-item">
          <div className="image-placeholder"></div>

          <div className="image-text">
            <h3 className="item-title">Title</h3>
            <p className="item-body">
              Body text for whatever you'd like to say. Add main takeaway points,
              quotes, anecdotes, or even a very very short story.
            </p>
            <button className="item-button">Button</button>
          </div>
        </div>

        {/* Item 3 */}
        <div className="image-item">
          <div className="image-placeholder"></div>

          <div className="image-text">
            <h3 className="item-title">Title</h3>
            <p className="item-body">
              Body text for whatever you'd like to say. Add main takeaway points,
              quotes, anecdotes, or even a very very short story.
            </p>
            <button className="item-button">Button</button>
          </div>
        </div>

      </div>
    </section>
  );
}
